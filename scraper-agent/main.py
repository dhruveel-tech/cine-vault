from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load env files before importing the scraper modules. This fixes cases where
# TMDB_API_KEY is read before scraper-agent/.env is loaded.
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for env_file in (
    PROJECT_ROOT / ".env.local",
    PROJECT_ROOT / ".env",
    CURRENT_DIR / ".env",
):
    if env_file.exists():
        load_dotenv(env_file, override=False)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents.tmdb_agent import (
    TMDBConfigError,
    TMDBLookupError,
    TMDBNetworkError,
    fetch_movie_from_tmdb,
    get_tmdb_diagnostics,
)


class MovieScrapeRequest(BaseModel):
    query: str = Field(..., min_length=1)
    region: str = Field(default="US", min_length=2, max_length=2)
    sources: List[str] = Field(default_factory=lambda: ["tmdb"])


class BulkScrapeRequest(BaseModel):
    titles: List[str]
    region: str = "US"
    sources: List[str] = Field(default_factory=lambda: ["tmdb"])


class StreamingRequest(BaseModel):
    title: str = Field(..., min_length=1)
    region: str = Field(default="US", min_length=2, max_length=2)


allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app = FastAPI(title="CineVault Scraper Agent", version="2.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "CineVault Scraper Agent",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    diagnostics = get_tmdb_diagnostics()
    return {
        "status": "ok",
        "tmdb_key_configured": diagnostics["tmdb_key_configured"],
        "tmdb_bearer_configured": diagnostics["tmdb_bearer_configured"],
        "tmdb_key_length": diagnostics["tmdb_key_length"],
        "tmdb_base_url": diagnostics["tmdb_base_url"],
        "env_files_checked": [str(PROJECT_ROOT / ".env.local"), str(PROJECT_ROOT / ".env"), str(CURRENT_DIR / ".env")],
    }


@app.get("/debug/tmdb")
async def debug_tmdb(query: str = "Dune Part Two", region: str = "US"):
    try:
        result = await fetch_movie_from_tmdb(query=query, region=region, sources=["tmdb"])
        return {
            "ok": True,
            "title": result.title,
            "tmdb_id": result.tmdb_id,
            "imdb_id": result.imdb_id,
            "release_year": result.release_year,
            "sources": result.data_sources,
        }
    except (TMDBConfigError, TMDBLookupError, TMDBNetworkError) as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_response())


@app.post("/scrape/movie")
async def scrape_movie(payload: MovieScrapeRequest):
    try:
        return await fetch_movie_from_tmdb(
            query=payload.query,
            region=payload.region.upper(),
            sources=payload.sources,
        )
    except (TMDBConfigError, TMDBLookupError, TMDBNetworkError) as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_response())
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Unexpected scraper failure.",
                "type": type(exc).__name__,
                "details": str(exc),
            },
        )


@app.post("/scrape/bulk")
async def scrape_bulk(payload: BulkScrapeRequest):
    results = []
    for title in payload.titles:
        try:
            results.append(await fetch_movie_from_tmdb(title, payload.region.upper(), payload.sources))
        except (TMDBConfigError, TMDBLookupError, TMDBNetworkError) as exc:
            results.append({"title": title, "error": exc.to_response()})
    return results


@app.get("/scrape/trending")
async def scrape_trending(region: str = "US", limit: int = 20):
    # Phase 2 keeps this endpoint available, but detailed implementation belongs
    # to the scheduled/bulk import pass.
    return {"region": region.upper(), "limit": limit, "results": []}


@app.get("/scrape/upcoming")
async def scrape_upcoming(region: str = "US", months: int = 3):
    return {"region": region.upper(), "months": months, "results": []}


@app.post("/scrape/streaming")
async def scrape_streaming(payload: StreamingRequest):
    movie = await fetch_movie_from_tmdb(payload.title, payload.region.upper(), ["tmdb", "streaming"])
    return movie.streaming_platforms
