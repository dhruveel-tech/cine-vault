# CineVault Scraper Agent

FastAPI microservice for Phase 2. It returns normalized `MovieJSON` data to the Next.js admin panel.

## Local setup

```bash
cd scraper-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux activation:

```bash
source .venv/bin/activate
```

## Environment

```env
TMDB_API_KEY=your-tmdb-api-key
ALLOWED_ORIGINS=http://localhost:3000
```

If `TMDB_API_KEY` is empty, the service returns demo fallback data so the Next.js preview/import flow can still be tested.

## Endpoints

```txt
GET  /health
POST /scrape/movie
POST /scrape/bulk
GET  /scrape/trending
GET  /scrape/upcoming
POST /scrape/streaming
```
