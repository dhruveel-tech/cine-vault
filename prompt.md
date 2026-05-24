# 🎬 CineVault — Movie Research Website
## Master Planning Prompt & Full Architecture Blueprint

---

## 🧭 PROJECT OVERVIEW

Build **CineVault**, a full-stack movie research and community platform that provides:
1. Deep movie/web-series information (worldwide, old & new)
2. An AI-powered Python web scraper agent that collects movie data and returns structured JSON
3. A custom blog/community portal for user-written movie articles
4. Full-stack: **Next.js 15 (App Router)** for frontend + backend API routes, **MongoDB** as the database, and a **Python FastAPI microservice** for the AI scraper agent

---

## 🏗️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript, Tailwind CSS, ShadCN UI) |
| Backend API | Next.js 15 API Routes (Route Handlers) + Server Actions |
| AI Scraper Agent | Python 3.12 + FastAPI + Scrapy/Playwright + LangChain |
| Database | MongoDB (Mongoose ODM via Next.js) |
| Auth | NextAuth.js v5 (OAuth + Email/Password) |
| Storage | Cloudinary (images/thumbnails/blog uploads) |
| Caching | Redis (Upstash, serverless) |
| Queue | Bull / Redis Queue (for scraper job scheduling) |
| Deployment | Vercel (Next.js) + Railway/Render (Python FastAPI) |
| API Data Sources | TMDB API, OMDB API, YouTube Data API, JustWatch (scraper) |

---

## 📁 PROJECT FOLDER STRUCTURE

```
cinevault/
│
├── app/                          # Next.js App Router (frontend + backend)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (public)/
│   │   ├── page.tsx              # Home page
│   │   ├── movies/
│   │   │   ├── page.tsx          # Movies listing
│   │   │   └── [slug]/page.tsx   # Movie detail page
│   │   ├── series/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx          # All blogs
│   │   │   ├── [slug]/page.tsx   # Blog detail
│   │   │   └── write/page.tsx    # Blog editor
│   │   ├── search/page.tsx
│   │   └── genres/[genre]/page.tsx
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── scraper/page.tsx  # Trigger AI scraper
│   │   │   └── movies/page.tsx   # Manage movies
│   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── movies/
│   │   │   ├── route.ts          # GET all / POST new movie
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE movie
│   │   ├── series/route.ts
│   │   ├── blogs/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── scraper/
│   │   │   └── trigger/route.ts  # Calls Python agent
│   │   └── upload/route.ts       # Cloudinary upload
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                        # ShadCN base components
│   ├── movie/
│   │   ├── MovieCard.tsx
│   │   ├── MovieDetailHero.tsx
│   │   ├── CastGrid.tsx
│   │   ├── StreamingBadges.tsx
│   │   └── TrailerModal.tsx
│   ├── blog/
│   │   ├── BlogCard.tsx
│   │   ├── BlogEditor.tsx         # Rich text editor (TipTap)
│   │   └── BlogComments.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       └── GenreFilter.tsx
│
├── lib/
│   ├── mongodb.ts                 # MongoDB connection with global cache
│   ├── auth.ts                    # NextAuth config
│   ├── cloudinary.ts
│   ├── redis.ts
│   └── scraper-client.ts         # HTTP client to call Python agent
│
├── models/                        # Mongoose schemas
│   ├── Movie.ts
│   ├── Series.ts
│   ├── Blog.ts
│   ├── User.ts
│   ├── Review.ts
│   └── ScraperJob.ts
│
├── types/
│   ├── movie.types.ts
│   ├── blog.types.ts
│   └── api.types.ts
│
├── hooks/
│   ├── useMovies.ts
│   ├── useSearch.ts
│   └── useInfiniteScroll.ts
│
├── scraper-agent/                 # Python FastAPI Microservice
│   ├── main.py
│   ├── agents/
│   │   ├── tmdb_agent.py
│   │   ├── imdb_scraper.py
│   │   ├── streaming_scraper.py
│   │   └── news_scraper.py
│   ├── schemas/
│   │   └── movie_schema.py
│   ├── utils/
│   │   ├── formatter.py
│   │   └── proxy_manager.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🗄️ MONGODB SCHEMA DESIGN

### 1. Movie Schema (`models/Movie.ts`)

```typescript
{
  _id: ObjectId,
  title: String,                    // e.g., "Oppenheimer"
  originalTitle: String,            // Original language title
  slug: String,                     // URL-friendly: "oppenheimer-2023"
  type: Enum["movie", "web_series", "documentary", "short_film", "anime"],
  contentRating: Enum["G","PG","PG-13","R","NC-17","TV-MA","TV-14"],
  genres: [String],                 // ["Drama","Biography","History"]
  languages: [String],              // ["English","German"]
  countries: [String],              // Production countries
  releaseDate: Date,
  releaseYear: Number,
  runtime: Number,                  // Minutes
  status: Enum["released","upcoming","in_production","cancelled"],

  synopsis: String,
  tagline: String,
  posterUrl: String,
  backdropUrl: String,
  trailerKey: String,               // YouTube video ID

  cast: [{
    name: String,
    character: String,
    profileUrl: String,
    order: Number
  }],

  crew: [{
    name: String,
    job: String,                    // "Director", "Producer", etc.
    department: String
  }],

  streamingPlatforms: [{
    name: String,                   // "Netflix", "Prime Video", "Disney+"
    region: String,                 // "IN", "US", "UK"
    url: String,
    type: Enum["subscription","rent","buy","free"]
  }],

  ratings: {
    imdb: { score: Number, votes: Number },
    tmdb: { score: Number, votes: Number },
    rottenTomatoes: { tomatometer: Number, audience: Number }
  },

  budget: Number,
  boxOffice: { domestic: Number, worldwide: Number },

  productionCompanies: [String],
  distributors: [String],
  awards: [{ name: String, category: String, year: Number, won: Boolean }],

  keywords: [String],               // For search
  ootPlatforms: [String],           // Over-the-top platforms available on

  tmdbId: String,
  imdbId: String,

  dataSource: Enum["tmdb","scraper","manual"],
  isVerified: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

### 2. Series Schema (`models/Series.ts`)
```typescript
{
  // All Movie fields +
  totalSeasons: Number,
  totalEpisodes: Number,
  episodeRuntime: Number,
  network: String,                  // "HBO", "Netflix Original", etc.
  firstAirDate: Date,
  lastAirDate: Date,
  seasons: [{
    seasonNumber: Number,
    name: String,
    episodeCount: Number,
    airDate: Date,
    posterUrl: String,
    overview: String
  }]
}
```

### 3. Blog Schema (`models/Blog.ts`)
```typescript
{
  _id: ObjectId,
  title: String,
  slug: String,
  content: String,                  // HTML from rich text editor
  excerpt: String,
  coverImage: String,

  author: { type: ObjectId, ref: "User" },
  relatedMovie: { type: ObjectId, ref: "Movie" },  // optional

  tags: [String],
  categories: Enum["review","analysis","news","top-list","opinion"],

  status: Enum["draft","published","rejected"],
  isEditorsPick: Boolean,

  views: Number,
  likes: [{ type: ObjectId, ref: "User" }],
  comments: [{
    user: { type: ObjectId, ref: "User" },
    text: String,
    createdAt: Date
  }],

  readTime: Number,                 // Auto-calculated (words / 200)
  createdAt: Date,
  publishedAt: Date
}
```

### 4. User Schema (`models/User.ts`)
```typescript
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  avatar: String,
  bio: String,
  role: Enum["user","writer","moderator","admin"],
  watchlist: [{ type: ObjectId, ref: "Movie" }],
  favorites: [{ type: ObjectId, ref: "Movie" }],
  blogsWritten: [{ type: ObjectId, ref: "Blog" }],
  createdAt: Date
}
```

---

## 🔌 NEXT.JS API ROUTES (Backend)

### Movie APIs

| Method | Route | Description |
|---|---|---|
| GET | `/api/movies` | List movies (filter, sort, paginate) |
| GET | `/api/movies/[id]` | Single movie full detail |
| GET | `/api/movies/search?q=` | Full-text search |
| POST | `/api/movies` | Add new movie (admin) |
| PUT | `/api/movies/[id]` | Update movie (admin) |
| DELETE | `/api/movies/[id]` | Delete movie (admin) |
| GET | `/api/movies/trending` | Trending movies |
| GET | `/api/movies/upcoming` | Upcoming releases |
| GET | `/api/movies/genre/[genre]` | Filter by genre |
| GET | `/api/movies/[id]/streaming` | Get OTT platforms for movie |

### Blog APIs

| Method | Route | Description |
|---|---|---|
| GET | `/api/blogs` | List published blogs |
| POST | `/api/blogs` | Create new blog (auth required) |
| GET | `/api/blogs/[id]` | Blog detail |
| PUT | `/api/blogs/[id]` | Edit blog (owner/admin) |
| POST | `/api/blogs/[id]/like` | Toggle like |
| POST | `/api/blogs/[id]/comment` | Add comment |

### Scraper API

| Method | Route | Description |
|---|---|---|
| POST | `/api/scraper/trigger` | Send job to Python agent |
| GET | `/api/scraper/jobs` | List scraper jobs + status |
| GET | `/api/scraper/jobs/[id]` | Job status + result |

---

## 🐍 PYTHON FASTAPI SCRAPER AGENT

### Architecture

```
scraper-agent/
├── main.py               # FastAPI app entry point
├── agents/
│   ├── tmdb_agent.py      # TMDB API integration (primary source)
│   ├── imdb_scraper.py    # IMDb supplemental scraping
│   ├── streaming_scraper.py  # JustWatch scraper for OTT data
│   └── news_scraper.py    # Movie news from Google News/RSS
├── schemas/
│   └── movie_schema.py    # Pydantic models = JSON output structure
├── utils/
│   ├── formatter.py       # Normalize + clean raw data
│   └── proxy_manager.py   # Rotate proxies to avoid blocks
├── requirements.txt
└── Dockerfile
```

### FastAPI Endpoints

```python
POST /scrape/movie
  Body: { "query": "Oppenheimer 2023", "sources": ["tmdb","imdb","streaming"] }
  Returns: Structured MovieJSON

POST /scrape/bulk
  Body: { "titles": ["Movie 1", "Movie 2", ...] }
  Returns: Array of MovieJSON

GET  /scrape/trending
  Params: ?region=IN&limit=20
  Returns: List of trending movies from TMDB

GET  /scrape/upcoming
  Params: ?region=US&months=3
  Returns: Upcoming releases

POST /scrape/streaming
  Body: { "title": "Inception", "region": "IN" }
  Returns: List of OTT platforms with links
```

### Standardized JSON Output Format (Pydantic Schema)

```python
# schemas/movie_schema.py

from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class ContentType(str, Enum):
    movie = "movie"
    web_series = "web_series"
    documentary = "documentary"
    anime = "anime"
    short_film = "short_film"

class CastMember(BaseModel):
    name: str
    character: Optional[str]
    profile_url: Optional[str]
    order: Optional[int]

class CrewMember(BaseModel):
    name: str
    job: str
    department: Optional[str]

class StreamingInfo(BaseModel):
    platform: str               # "Netflix"
    region: str                 # "IN"
    url: Optional[str]
    type: str                   # "subscription" | "rent" | "buy"

class Ratings(BaseModel):
    imdb_score: Optional[float]
    imdb_votes: Optional[int]
    tmdb_score: Optional[float]
    rotten_tomatoes: Optional[int]

class MovieJSON(BaseModel):
    title: str
    original_title: Optional[str]
    content_type: ContentType
    genres: List[str]
    languages: List[str]
    countries: List[str]
    release_date: Optional[str]
    release_year: Optional[int]
    runtime_minutes: Optional[int]
    status: Optional[str]
    synopsis: Optional[str]
    tagline: Optional[str]
    poster_url: Optional[str]
    backdrop_url: Optional[str]
    trailer_youtube_key: Optional[str]
    cast: List[CastMember]
    crew: List[CrewMember]
    streaming_platforms: List[StreamingInfo]
    ratings: Optional[Ratings]
    budget_usd: Optional[int]
    box_office_worldwide_usd: Optional[int]
    production_companies: List[str]
    awards: List[dict]
    keywords: List[str]
    tmdb_id: Optional[str]
    imdb_id: Optional[str]
    data_sources: List[str]
    scraped_at: str             # ISO timestamp
```

### Agent Logic (tmdb_agent.py)

```python
import httpx
import os
from schemas.movie_schema import MovieJSON
from utils.formatter import normalize_movie_data

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

async def fetch_movie_from_tmdb(query: str) -> MovieJSON:
    async with httpx.AsyncClient() as client:
        # Step 1: Search
        search = await client.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY,
            "query": query
        })
        result = search.json()["results"][0]
        media_type = result["media_type"]  # "movie" or "tv"
        tmdb_id = result["id"]

        # Step 2: Full details
        detail = await client.get(
            f"{TMDB_BASE}/{media_type}/{tmdb_id}",
            params={"api_key": TMDB_API_KEY, "append_to_response": "credits,videos,release_dates,watch/providers"}
        )
        raw = detail.json()

        # Step 3: Normalize to standard schema
        return normalize_movie_data(raw, media_type)
```

---

## 🎨 FRONTEND PAGES & FEATURES

### 1. Home Page (`/`)
- Hero banner with trending movies (auto-rotating)
- "Now In Theaters" horizontal scroll section
- "New on Streaming" section (Netflix, Prime, Disney+, etc.)
- Genre filter row
- Upcoming releases countdown cards
- Editor's Pick blogs
- World cinema spotlight (international films)

### 2. Movie Detail Page (`/movies/[slug]`)
- Full-width backdrop hero with poster
- Core info: title, year, rating, runtime, content rating, genres
- Synopsis + tagline
- Cast grid with character names
- Crew section (director, writers, producers)
- Streaming availability widget (OTT platforms by region, with links)
- Trailer modal (YouTube embed)
- Awards & accolades section
- Box office / budget stats
- User reviews & ratings
- Related movies section
- "Add to Watchlist" / "Mark as Watched" buttons

### 3. Search Page (`/search`)
- Instant search with debounce (300ms)
- Filter panel: genre, year range, content type, language, rating, OTT platform
- Sort: relevance, rating, newest, popularity
- Results grid with lazy loading / infinite scroll

### 4. Blog Portal (`/blog`)
- Blog listing with category tabs (Reviews, Analysis, News, Top Lists, Opinion)
- Featured / Editor's Pick carousel
- Blog write page with TipTap rich text editor
  - Bold, italic, headings, lists, quotes
  - Image upload (Cloudinary)
  - Movie tag/link (search and attach a movie)
  - Auto-save as draft
- Blog detail page with comments section
- Author profile + their other blogs

### 5. Admin Dashboard (`/admin`)
- Movie CRUD panel
- "Trigger Scraper" panel: Enter a movie title → calls Python agent → preview JSON → confirm import to MongoDB
- Blog moderation queue (approve/reject)
- User management
- Scraper job history

---

## 🔐 AUTHENTICATION & ROLES

Use **NextAuth.js v5** with:
- Email/Password (bcrypt hash stored in MongoDB)
- Google OAuth
- GitHub OAuth

**Role System:**
- `user` — Can browse, add to watchlist, like/comment on blogs
- `writer` — Can write and publish blogs
- `moderator` — Can approve/reject blogs
- `admin` — Full access including scraper trigger and movie management

Protect routes using Next.js middleware:
```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth"
export const config = { matcher: ["/admin/:path*", "/blog/write", "/dashboard/:path*"] }
```

---

## ⚡ PERFORMANCE & SEO

- Use **ISR (Incremental Static Regeneration)** for movie detail pages
  - `revalidate: 86400` (24 hours) for stable data
  - On-demand revalidation when admin updates a movie
- **Dynamic OG images** for every movie page (Next.js OG image API)
- **Structured data (JSON-LD)** schema for Movie, BlogPosting, BreadcrumbList
- MongoDB Atlas **Search Index** for full-text search on title, cast, genres, synopsis
- Redis cache for trending/home page data (TTL: 1 hour)
- Next.js Image component with AVIF/WebP and Cloudinary CDN

---

## 🔄 SCRAPER AGENT WORKFLOW

```
Admin Panel
    │
    ▼
POST /api/scraper/trigger  (Next.js)
    │   { title, sources, region }
    ▼
Python FastAPI Agent  (separate service)
    ├── TMDB API call       → credits, videos, watch providers
    ├── IMDb supplemental   → ratings, awards, trivia
    └── JustWatch scraper   → OTT platform availability
    │
    ▼
Pydantic validation + normalize → MovieJSON
    │
    ▼
Response to Next.js API
    │
    ▼
Admin reviews JSON preview in UI
    │
    ▼
Confirm → POST /api/movies  → Save to MongoDB
```

**Bulk Scraping via cron (optional):**
- Schedule nightly Python job using APScheduler
- Pulls TMDB "now_playing" + "upcoming" lists
- Saves to DB automatically with `isVerified: false` flag
- Admin reviews unverified entries in dashboard

---

## 📦 ENVIRONMENT VARIABLES

```env
# Next.js (.env.local)
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://cinevault.com

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

REDIS_URL=redis://...
PYTHON_AGENT_URL=https://your-agent.railway.app

# Python Agent (.env)
TMDB_API_KEY=...
OMDB_API_KEY=...
YOUTUBE_DATA_API_KEY=...
PROXY_LIST=...  # comma-separated proxy URLs
```

---

## 🚀 DEVELOPMENT PHASES

### Phase 1 — Foundation (Week 1–2)
- [ ] Set up Next.js 15 with App Router, TypeScript, Tailwind, ShadCN
- [ ] MongoDB Atlas connection with Mongoose, global cache pattern
- [ ] NextAuth v5 with Google + Email/Password
- [ ] Movie & Series Mongoose models
- [ ] Basic CRUD API routes for movies
- [ ] Movie listing and detail pages (static design)

### Phase 2 — Scraper Agent (Week 3–4)
- [ ] Set up Python FastAPI project in `scraper-agent/`
- [ ] TMDB API agent (primary data source)
- [ ] IMDb supplemental scraper with Playwright
- [ ] JustWatch streaming availability scraper
- [ ] Pydantic schema for standardized JSON output
- [ ] Connect scraper API to Next.js admin trigger endpoint
- [ ] Admin scraper panel: trigger → preview → import

### Phase 3 — Movie Features (Week 5–6)
- [ ] Full movie detail page with all sections
- [ ] Advanced search with filters
- [ ] Genre pages, trending, upcoming sections
- [ ] Watchlist & favorites (user-specific)
- [ ] Streaming availability widget
- [ ] Trailer modal integration
- [ ] Redis caching for hot data

### Phase 4 — Blog Portal (Week 7–8)
- [ ] TipTap rich text blog editor with image upload
- [ ] Blog create / edit / draft / publish flow
- [ ] Blog listing with category filter
- [ ] Comments system
- [ ] Likes / engagement
- [ ] Moderation queue for admins/moderators

### Phase 5 — Polish & Launch (Week 9–10)
- [ ] SEO: JSON-LD structured data, dynamic OG images
- [ ] ISR + on-demand revalidation
- [ ] Mobile-first responsive refinement
- [ ] MongoDB Atlas Search index
- [ ] Error boundaries, loading skeletons
- [ ] Deploy: Vercel (Next.js) + Railway (Python agent)
- [ ] Set up domain, SSL, monitoring (Sentry, Vercel Analytics)

---

## 🛠️ KEY PACKAGES

### Next.js
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "mongoose": "^8.0.0",
    "next-auth": "^5.0.0",
    "@auth/mongodb-adapter": "latest",
    "tailwindcss": "^4.0.0",
    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",
    "cloudinary": "latest",
    "ioredis": "latest",
    "zod": "latest",
    "react-query": "^5.0.0",
    "zustand": "latest",
    "next-themes": "latest",
    "framer-motion": "latest"
  }
}
```

### Python Agent
```txt
fastapi==0.115.0
uvicorn==0.32.0
httpx==0.28.0
playwright==1.49.0
scrapy==2.12.0
pydantic==2.10.0
motor==3.6.0          # async MongoDB driver
python-dotenv==1.0.0
apscheduler==3.10.0
langchain==0.3.0      # optional: for AI-assisted data cleanup
beautifulsoup4==4.12.0
```

---

## 💡 BONUS AI FEATURES (Phase 6 — Optional)

1. **AI Movie Recommendation Engine**: Based on user's watchlist + favorites using collaborative filtering (Python + scikit-learn or LangChain with vector embeddings in MongoDB Atlas Vector Search)

2. **Smart Blog Assistant**: In the blog editor, a "Generate Outline" button calls Claude API to help writers structure their review

3. **Automated Plot Summary Cleanup**: When scraping, pass raw synopsis through an LLM prompt to clean up and standardize quality of plot descriptions

4. **Sentiment Analysis on Reviews**: Classify user comments as positive/negative/neutral using transformers

---

## 📋 COMPLETE PROMPT TO GIVE YOUR AI CODING ASSISTANT

> Build a full-stack movie research platform called **CineVault** using the following exact specifications:
>
> **Frontend + Backend:** Next.js 15 with App Router, TypeScript, Tailwind CSS, ShadCN UI
> **Database:** MongoDB Atlas with Mongoose ODM. Use a global connection cache to prevent multiple connections during Next.js hot reloads.
> **Auth:** NextAuth.js v5 with Google OAuth and Email/Password. Roles: user, writer, moderator, admin.
> **Python Agent:** A separate FastAPI microservice that scrapes movie data from TMDB API (primary), IMDb (supplemental), and JustWatch (streaming). All output must be returned as a validated Pydantic JSON schema (MovieJSON).
>
> **Core Features to Build:**
> 1. Movie/Series detail pages with: poster, backdrop, synopsis, full cast & crew, OTT/streaming platform availability by region, trailer embed, ratings (TMDB/IMDb/RT), awards, box office, keywords
> 2. Advanced search with filters: genre, year, content type (movie/series/documentary/anime), language, streaming platform, rating range
> 3. Admin scraper panel: input movie title → call Python FastAPI agent → preview returned JSON → confirm import to MongoDB
> 4. Blog portal: TipTap rich text editor with image upload to Cloudinary, draft/publish workflow, category tags, comments, likes, admin moderation queue
> 5. User features: watchlist, favorites, reviews, profile page
>
> **MongoDB schemas required:** Movie, Series (extends Movie), Blog, User, Review, ScraperJob — following the schema structure provided in the blueprint.
>
> **API routes (Next.js Route Handlers):** CRUD for movies, series, blogs. Scraper trigger endpoint that calls Python agent via HTTP. Auth endpoints via NextAuth.
>
> **Performance:** ISR for movie pages (revalidate 86400s), Redis (Upstash) caching for trending/home data, MongoDB Atlas Search for full-text search, dynamic OG images, JSON-LD structured data for SEO.
>
> **Deployment:** Vercel for Next.js, Railway for Python FastAPI. Use environment variables for all API keys. Docker support for the Python agent.

---

*Generated for: CineVault Movie Research Platform | Stack: Next.js 15 + MongoDB + Python FastAPI*