from datetime import datetime, timezone
from typing import Any

from schemas.movie_schema import CastMember, ContentType, CrewMember, MovieJSON, Ratings, StreamingInfo

TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original"


def image_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{TMDB_IMAGE_BASE}{path}"


def release_year(date_value: str | None) -> int | None:
    if not date_value:
        return None
    try:
        return int(date_value[:4])
    except ValueError:
        return None


def media_to_content_type(media_type: str, raw: dict[str, Any]) -> ContentType:
    if media_type == "tv":
        return ContentType.web_series
    genres = {genre.get("name", "").lower() for genre in raw.get("genres", [])}
    if "documentary" in genres:
        return ContentType.documentary
    if "animation" in genres and any(country in ["JP", "Japan"] for country in raw.get("origin_country", [])):
        return ContentType.anime
    return ContentType.movie


def extract_trailer_key(raw: dict[str, Any]) -> str | None:
    for video in raw.get("videos", {}).get("results", []):
        if video.get("site") == "YouTube" and video.get("type") in {"Trailer", "Teaser"}:
            return video.get("key")
    return None


def normalize_watch_providers(raw: dict[str, Any], region: str) -> list[StreamingInfo]:
    providers = raw.get("watch/providers", {}).get("results", {}).get(region.upper(), {})
    link = providers.get("link")
    output: list[StreamingInfo] = []
    groups = [("flatrate", "subscription"), ("rent", "rent"), ("buy", "buy"), ("free", "free")]

    seen: set[tuple[str, str]] = set()
    for tmdb_key, platform_type in groups:
        for item in providers.get(tmdb_key, []) or []:
            name = item.get("provider_name")
            if not name:
                continue
            key = (name, platform_type)
            if key in seen:
                continue
            seen.add(key)
            output.append(StreamingInfo(platform=name, region=region.upper(), url=link, type=platform_type))
    return output


def normalize_movie_data(raw: dict[str, Any], media_type: str, region: str = "US") -> MovieJSON:
    release_date = raw.get("release_date") if media_type == "movie" else raw.get("first_air_date")
    title = raw.get("title") or raw.get("name") or raw.get("original_title") or raw.get("original_name") or "Untitled"
    original_title = raw.get("original_title") or raw.get("original_name")

    credits = raw.get("credits", {})
    cast = [
        CastMember(
            name=item.get("name", ""),
            character=item.get("character"),
            profile_url=image_url(item.get("profile_path")),
            order=item.get("order"),
        )
        for item in (credits.get("cast", [])[:24])
        if item.get("name")
    ]
    crew = [
        CrewMember(name=item.get("name", ""), job=item.get("job", ""), department=item.get("department"))
        for item in (credits.get("crew", [])[:40])
        if item.get("name") and item.get("job")
    ]

    external_ids = raw.get("external_ids", {})
    keywords_payload = raw.get("keywords", {})
    if media_type == "movie":
        keywords = [item.get("name") for item in keywords_payload.get("keywords", [])]
    else:
        keywords = [item.get("name") for item in keywords_payload.get("results", [])]

    revenue = raw.get("revenue") if media_type == "movie" else None

    return MovieJSON(
        title=title,
        original_title=original_title,
        content_type=media_to_content_type(media_type, raw),
        genres=[genre.get("name") for genre in raw.get("genres", []) if genre.get("name")],
        languages=[language.get("english_name") or language.get("name") for language in raw.get("spoken_languages", []) if language.get("english_name") or language.get("name")],
        countries=[country.get("name") for country in raw.get("production_countries", []) if country.get("name")],
        release_date=release_date,
        release_year=release_year(release_date),
        runtime_minutes=raw.get("runtime") or (raw.get("episode_run_time") or [None])[0],
        status=str(raw.get("status", "released")).lower().replace(" ", "_"),
        synopsis=raw.get("overview"),
        tagline=raw.get("tagline"),
        poster_url=image_url(raw.get("poster_path")),
        backdrop_url=image_url(raw.get("backdrop_path")),
        trailer_youtube_key=extract_trailer_key(raw),
        cast=cast,
        crew=crew,
        streaming_platforms=normalize_watch_providers(raw, region),
        ratings=Ratings(tmdb_score=raw.get("vote_average"), tmdb_votes=raw.get("vote_count")),
        budget_usd=raw.get("budget") if media_type == "movie" else None,
        box_office_worldwide_usd=revenue,
        production_companies=[company.get("name") for company in raw.get("production_companies", []) if company.get("name")],
        awards=[],
        keywords=[keyword for keyword in keywords if keyword],
        tmdb_id=str(raw.get("id")) if raw.get("id") else None,
        imdb_id=external_ids.get("imdb_id") or raw.get("imdb_id"),
        data_sources=["tmdb"],
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )
