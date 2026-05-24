from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ContentType(str, Enum):
    movie = "movie"
    web_series = "web_series"
    documentary = "documentary"
    anime = "anime"
    short_film = "short_film"


class CastMember(BaseModel):
    name: str
    character: Optional[str] = None
    profile_url: Optional[str] = None
    order: Optional[int] = None


class CrewMember(BaseModel):
    name: str
    job: str
    department: Optional[str] = None


class StreamingInfo(BaseModel):
    platform: str
    region: str
    url: Optional[str] = None
    type: str = Field(pattern="^(subscription|rent|buy|free)$")


class Ratings(BaseModel):
    imdb_score: Optional[float] = None
    imdb_votes: Optional[int] = None
    tmdb_score: Optional[float] = None
    tmdb_votes: Optional[int] = None
    rotten_tomatoes: Optional[int] = None


class MovieJSON(BaseModel):
    title: str
    original_title: Optional[str] = None
    content_type: ContentType
    genres: list[str] = []
    languages: list[str] = []
    countries: list[str] = []
    release_date: Optional[str] = None
    release_year: Optional[int] = None
    runtime_minutes: Optional[int] = None
    status: Optional[str] = None
    synopsis: Optional[str] = None
    tagline: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_youtube_key: Optional[str] = None
    cast: list[CastMember] = []
    crew: list[CrewMember] = []
    streaming_platforms: list[StreamingInfo] = []
    ratings: Optional[Ratings] = None
    budget_usd: Optional[int] = None
    box_office_worldwide_usd: Optional[int] = None
    production_companies: list[str] = []
    awards: list[dict[str, Any]] = []
    keywords: list[str] = []
    tmdb_id: Optional[str] = None
    imdb_id: Optional[str] = None
    data_sources: list[str] = []
    scraped_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ScrapeMovieRequest(BaseModel):
    query: str
    region: str = "US"
    sources: list[str] = ["tmdb", "streaming"]


class BulkScrapeRequest(BaseModel):
    titles: list[str]
    region: str = "US"
    sources: list[str] = ["tmdb", "streaming"]


class StreamingRequest(BaseModel):
    title: str
    region: str = "US"
