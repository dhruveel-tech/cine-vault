from schemas.movie_schema import StreamingInfo


async def fetch_streaming_availability(title: str, region: str = "US") -> list[StreamingInfo]:
    # Phase 2 keeps JustWatch as a controlled integration point.
    # TMDB watch/providers already fills streaming data in tmdb_agent.py.
    # Add Playwright/JustWatch-specific logic here when you are ready to scrape it directly.
    return []
