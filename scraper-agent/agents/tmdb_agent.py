from __future__ import annotations

import os
import re
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Any, Dict, Iterable, List, Optional, Tuple

import httpx

from schemas.movie_schema import CastMember, CrewMember, MovieJSON, Ratings, StreamingInfo

IMAGE_BASE = "https://image.tmdb.org/t/p/original"
DEFAULT_TMDB_BASE = "https://api.themoviedb.org/3"


class TMDBBaseError(Exception):
    status_code = 500

    def __init__(self, message: str, *, details: str = "", hint: str = ""):
        super().__init__(message)
        self.message = message
        self.details = details
        self.hint = hint

    def to_response(self) -> Dict[str, str]:
        return {
            "message": self.message,
            "details": self.details,
            "hint": self.hint,
        }


class TMDBConfigError(TMDBBaseError):
    status_code = 400


class TMDBLookupError(TMDBBaseError):
    status_code = 404


class TMDBNetworkError(TMDBBaseError):
    status_code = 502


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip().strip('"').strip("'")


def get_tmdb_diagnostics() -> Dict[str, Any]:
    api_key = _env("TMDB_API_KEY")
    bearer = _env("TMDB_READ_ACCESS_TOKEN") or _env("TMDB_BEARER_TOKEN")
    return {
        "tmdb_key_configured": bool(api_key),
        "tmdb_bearer_configured": bool(bearer),
        "tmdb_key_length": len(api_key),
        "tmdb_base_url": _env("TMDB_BASE_URL") or DEFAULT_TMDB_BASE,
    }


def _auth() -> Tuple[Dict[str, str], Dict[str, str]]:
    api_key = _env("TMDB_API_KEY")
    bearer = _env("TMDB_READ_ACCESS_TOKEN") or _env("TMDB_BEARER_TOKEN")

    headers = {
        "Accept": "application/json",
        "User-Agent": "CineVault-Scraper/2.2",
    }
    params: Dict[str, str] = {}

    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    elif api_key:
        params["api_key"] = api_key
    else:
        raise TMDBConfigError(
            "TMDB credentials are missing.",
            details="Set TMDB_API_KEY in scraper-agent/.env or set TMDB_READ_ACCESS_TOKEN.",
            hint="Restart uvicorn after editing .env.",
        )

    return headers, params


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value).strip().lower()
    return re.sub(r"\s+", " ", value)


def _title_variants(query: str) -> List[str]:
    q = query.strip()
    variants = [q]
    # TMDB website search is forgiving; API search needs extra variants.
    if ":" in q:
        variants.append(q.split(":", 1)[0].strip())
        variants.append(q.replace(":", " ").strip())
    for sep in [" - ", " – ", " — "]:
        if sep in q:
            variants.append(q.split(sep, 1)[0].strip())
            variants.append(q.replace(sep.strip(), " ").strip())
    variants.append(re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", q)).strip())
    seen = set()
    final = []
    for item in variants:
        normalized = _normalize_text(item)
        if item and normalized and normalized not in seen:
            seen.add(normalized)
            final.append(item)
    return final


def _language_candidates(region: str) -> List[Optional[str]]:
    region = (region or "US").upper()
    by_region = {
        "IN": ["en-IN", "hi-IN", "ta-IN", "te-IN", "ml-IN", "kn-IN", "bn-IN", "en-US", None],
        "US": ["en-US", None],
        "GB": ["en-GB", "en-US", None],
    }
    return by_region.get(region, [f"en-{region}", "en-US", None])


def _score_result(result: Dict[str, Any], query: str, requested_region: str) -> float:
    query_norm = _normalize_text(query)
    names = [
        result.get("title"),
        result.get("name"),
        result.get("original_title"),
        result.get("original_name"),
    ]
    best_name_score = 0.0
    for name in names:
        if not name:
            continue
        name_norm = _normalize_text(str(name))
        ratio = SequenceMatcher(None, query_norm, name_norm).ratio()
        if query_norm == name_norm:
            ratio += 0.45
        elif query_norm in name_norm or name_norm in query_norm:
            ratio += 0.22
        best_name_score = max(best_name_score, ratio)

    popularity = float(result.get("popularity") or 0)
    popularity_score = min(popularity / 500.0, 0.25)
    media_bonus = 0.08 if result.get("media_type") == "movie" else 0.0
    region_bonus = 0.0
    origin_countries = result.get("origin_country") or []
    if requested_region.upper() in origin_countries:
        region_bonus += 0.18

    return best_name_score + popularity_score + media_bonus + region_bonus


async def _request_json(
    client: httpx.AsyncClient,
    path: str,
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    headers, auth_params = _auth()
    base = (_env("TMDB_BASE_URL") or DEFAULT_TMDB_BASE).rstrip("/")
    url = f"{base}/{path.lstrip('/')}"
    final_params = {**auth_params, **(params or {})}

    try:
        response = await client.get(url, params=final_params, headers=headers)
    except httpx.RequestError as exc:
        raise TMDBNetworkError(
            "Network error while contacting TMDB.",
            details=f"{type(exc).__name__}: {str(exc) or repr(exc)}",
            hint=(
                "Open https://api.themoviedb.org/3/configuration in your browser. "
                "If it does not open, your network, DNS, firewall, VPN, or proxy is blocking TMDB."
            ),
        )

    if response.status_code in (401, 403):
        raise TMDBConfigError(
            "TMDB rejected the configured credentials.",
            details=response.text[:500],
            hint="Copy the full TMDB v3 API key or set TMDB_READ_ACCESS_TOKEN, then restart uvicorn.",
        )

    if response.status_code == 429:
        raise TMDBNetworkError(
            "TMDB rate limit reached.",
            details=response.text[:500],
            hint="Wait a minute and try again.",
        )

    if response.status_code >= 400:
        raise TMDBNetworkError(
            f"TMDB returned HTTP {response.status_code}.",
            details=response.text[:500],
            hint="Check the title, region, and TMDB credentials.",
        )

    return response.json()


async def _search_tmdb(client: httpx.AsyncClient, query: str, region: str) -> Dict[str, Any]:
    attempts: List[Dict[str, Any]] = []
    candidates: List[Dict[str, Any]] = []

    for variant in _title_variants(query):
        for language in _language_candidates(region):
            for endpoint in ("search/multi", "search/movie", "search/tv"):
                params: Dict[str, Any] = {
                    "query": variant,
                    "include_adult": "false",
                    "page": 1,
                }
                if language:
                    params["language"] = language
                # Only movie search supports region consistently. Passing region to
                # multi/tv can be ignored by TMDB or produce inconsistent behavior.
                if endpoint == "search/movie":
                    params["region"] = region.upper()

                attempts.append({"endpoint": endpoint, "query": variant, "language": language})
                data = await _request_json(client, endpoint, params)
                for item in data.get("results", []):
                    media_type = item.get("media_type")
                    if endpoint == "search/movie":
                        media_type = "movie"
                    elif endpoint == "search/tv":
                        media_type = "tv"
                    if media_type not in {"movie", "tv"}:
                        continue
                    item["media_type"] = media_type
                    item["_score"] = _score_result(item, query, region)
                    candidates.append(item)
                if candidates:
                    break
            if candidates:
                break
        if candidates:
            break

    if not candidates:
        raise TMDBLookupError(
            "No TMDB result found for this title.",
            details=f"Tried variants: {', '.join(_title_variants(query))}. Region: {region.upper()}.",
            hint="Try the base title only, remove subtitle text, or search by the exact title shown on TMDB.",
        )

    candidates.sort(key=lambda item: item.get("_score", 0), reverse=True)
    best = candidates[0]
    if best.get("_score", 0) < 0.42:
        raise TMDBLookupError(
            "TMDB returned results, but none matched confidently.",
            details=f"Best candidate: {best.get('title') or best.get('name')} with score {best.get('_score'):.2f}.",
            hint="Use the exact title or search using the TMDB base title.",
        )
    return best


def _image(path: Optional[str]) -> Optional[str]:
    return f"{IMAGE_BASE}{path}" if path else None


def _clean_status(status: Optional[str]) -> Optional[str]:
    if not status:
        return None
    return status.strip().lower().replace(" ", "_")


def _streaming_platforms(raw: Dict[str, Any], region: str) -> List[StreamingInfo]:
    results = ((raw.get("watch/providers") or {}).get("results") or {})
    region_data = results.get(region.upper()) or results.get("US") or {}
    platforms: List[StreamingInfo] = []
    seen = set()
    for provider_type, output_type in (
        ("flatrate", "subscription"),
        ("rent", "rent"),
        ("buy", "buy"),
        ("free", "free"),
    ):
        for provider in region_data.get(provider_type, []) or []:
            name = provider.get("provider_name")
            key = (name, output_type)
            if not name or key in seen:
                continue
            seen.add(key)
            platforms.append(
                StreamingInfo(
                    platform=name,
                    region=region.upper(),
                    url=region_data.get("link"),
                    type=output_type,
                )
            )
    return platforms


def _keywords(raw: Dict[str, Any], media_type: str) -> List[str]:
    keyword_block = raw.get("keywords") or {}
    values = keyword_block.get("keywords") if media_type == "movie" else keyword_block.get("results")
    return [item.get("name") for item in (values or []) if item.get("name")]


def _release_year(date_value: Optional[str]) -> Optional[int]:
    if not date_value:
        return None
    try:
        return int(date_value[:4])
    except Exception:
        return None


def _runtime(raw: Dict[str, Any], media_type: str) -> Optional[int]:
    if media_type == "movie":
        return raw.get("runtime")
    runtimes = raw.get("episode_run_time") or []
    return runtimes[0] if runtimes else None


def _external_ids(raw: Dict[str, Any]) -> Dict[str, Optional[str]]:
    external = raw.get("external_ids") or {}
    return {"imdb_id": external.get("imdb_id") or raw.get("imdb_id")}


def _normalize_movie(raw: Dict[str, Any], media_type: str, region: str, sources: Iterable[str]) -> MovieJSON:
    is_movie = media_type == "movie"
    title = raw.get("title") if is_movie else raw.get("name")
    original_title = raw.get("original_title") if is_movie else raw.get("original_name")
    release_date = raw.get("release_date") if is_movie else raw.get("first_air_date")

    cast = []
    for item in ((raw.get("credits") or {}).get("cast") or [])[:20]:
        cast.append(
            CastMember(
                name=item.get("name") or "Unknown",
                character=item.get("character"),
                profile_url=_image(item.get("profile_path")),
                order=item.get("order"),
            )
        )

    crew = []
    for item in ((raw.get("credits") or {}).get("crew") or []):
        job = item.get("job")
        if job in {"Director", "Producer", "Executive Producer", "Writer", "Screenplay", "Creator"}:
            crew.append(
                CrewMember(
                    name=item.get("name") or "Unknown",
                    job=job or "Crew",
                    department=item.get("department"),
                )
            )

    videos = (raw.get("videos") or {}).get("results") or []
    trailer_key = next(
        (
            video.get("key")
            for video in videos
            if video.get("site") == "YouTube" and video.get("type") in {"Trailer", "Teaser"}
        ),
        None,
    )

    spoken_languages = raw.get("spoken_languages") or []
    countries = raw.get("production_countries") or []
    companies = raw.get("production_companies") or []
    external = _external_ids(raw)

    return MovieJSON(
        title=title or original_title or "Untitled",
        original_title=original_title,
        content_type="movie" if is_movie else "web_series",
        genres=[genre.get("name") for genre in raw.get("genres", []) if genre.get("name")],
        languages=[lang.get("english_name") or lang.get("name") for lang in spoken_languages if lang.get("english_name") or lang.get("name")],
        countries=[country.get("name") for country in countries if country.get("name")],
        release_date=release_date,
        release_year=_release_year(release_date),
        runtime_minutes=_runtime(raw, media_type),
        status=_clean_status(raw.get("status")),
        synopsis=raw.get("overview"),
        tagline=raw.get("tagline"),
        poster_url=_image(raw.get("poster_path")),
        backdrop_url=_image(raw.get("backdrop_path")),
        trailer_youtube_key=trailer_key,
        cast=cast,
        crew=crew,
        streaming_platforms=_streaming_platforms(raw, region),
        ratings=Ratings(
            imdb_score=None,
            imdb_votes=None,
            tmdb_score=raw.get("vote_average"),
            tmdb_votes=raw.get("vote_count"),
            rotten_tomatoes=None,
        ),
        budget_usd=raw.get("budget") if is_movie else None,
        box_office_worldwide_usd=raw.get("revenue") if is_movie else None,
        production_companies=[company.get("name") for company in companies if company.get("name")],
        awards=[],
        keywords=_keywords(raw, media_type),
        tmdb_id=str(raw.get("id")) if raw.get("id") is not None else None,
        imdb_id=external.get("imdb_id"),
        data_sources=list(dict.fromkeys(["tmdb", *sources])),
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )


async def fetch_movie_from_tmdb(query: str, region: str = "US", sources: Optional[List[str]] = None) -> MovieJSON:
    query = (query or "").strip()
    if not query:
        raise TMDBLookupError("Movie title is required.")
    region = (region or "US").upper()
    sources = sources or ["tmdb"]

    timeout = httpx.Timeout(connect=10.0, read=25.0, write=10.0, pool=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, trust_env=True) as client:
        selected = await _search_tmdb(client, query, region)
        media_type = selected["media_type"]
        tmdb_id = selected["id"]
        append = "credits,videos,watch/providers,keywords,external_ids"
        if media_type == "movie":
            append += ",release_dates"
        else:
            append += ",content_ratings"
        raw = await _request_json(
            client,
            f"{media_type}/{tmdb_id}",
            {"append_to_response": append, "language": _language_candidates(region)[0] or "en-US"},
        )
        return _normalize_movie(raw, media_type, region, sources)
