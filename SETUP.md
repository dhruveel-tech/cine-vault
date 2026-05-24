# CineVault Setup Guide

This guide explains how to set up and run the CineVault project locally.

CineVault uses:

- Next.js 15 App Router with TypeScript
- MongoDB with Mongoose
- Auth.js / NextAuth v5
- Python FastAPI scraper agent
- TMDB API for movie metadata
- Optional Cloudinary image uploads
- Optional Upstash Redis caching

---

## 1. Prerequisites

Install the following before starting:

| Tool | Recommended Version | Purpose |
|---|---:|---|
| Node.js | 20 LTS or newer | Run Next.js app |
| npm | 10+ | Install frontend/backend dependencies |
| Python | 3.10+ or 3.12 | Run FastAPI scraper agent |
| MongoDB | Local MongoDB or MongoDB Atlas | Database |
| MongoDB Compass | Latest | Database GUI |
| Git | Latest | Version control |

For local development, this guide assumes your project is located at:

```txt
E:\Movie-Research
```

Use your actual project path if different.

---

## 2. Install Next.js Dependencies

Open PowerShell in the project root:

```powershell
cd E:\Movie-Research
npm install
```

---

## 3. Configure MongoDB

### Option A: Local MongoDB with MongoDB Compass

Make sure your local MongoDB server is running.

MongoDB Compass should connect to:

```txt
mongodb://127.0.0.1:27017
```

Your app database will be:

```txt
cinevault
```

### Option B: MongoDB Atlas

Use your Atlas connection string instead:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinevault?retryWrites=true&w=majority
```

---

## 4. Create `.env.local`

Create this file in the project root:

```txt
E:\Movie-Research\.env.local
```

Use this template:

```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/cinevault

# Auth.js / NextAuth v5
AUTH_SECRET=replace-with-generated-secret
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Python FastAPI scraper agent
PYTHON_AGENT_URL=http://127.0.0.1:8000

# Optional Cloudinary uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Optional Upstash Redis cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Generate a secure auth secret:

```powershell
npx auth secret
```

Copy the generated value into:

```env
AUTH_SECRET=your-generated-secret
```

If you are not using Google or GitHub login yet, keep the fields in `.env.local`, but you can leave them empty during local testing if your credentials login flow is working.

---

## 5. Create Python Agent Environment File

Create this file:

```txt
E:\Movie-Research\scraper-agent\.env
```

Use this template:

```env
TMDB_API_KEY=your-full-tmdb-v3-api-key
TMDB_READ_ACCESS_TOKEN=
OMDB_API_KEY=
YOUTUBE_DATA_API_KEY=
ALLOWED_ORIGINS=http://localhost:3000
```

Important:

- Use the full TMDB v3 API key.
- Restart the Python agent whenever you change this file.
- The app can also detect env values from root `.env.local`, but keeping scraper keys inside `scraper-agent/.env` is recommended.

---

## 6. Start the Next.js App

Open Terminal 1:

```powershell
cd E:\Movie-Research
npm run dev
```

Open the app:

```txt
http://localhost:3000
```

---

## 7. Start the Python FastAPI Scraper Agent

Open Terminal 2:

```powershell
cd E:\Movie-Research\scraper-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The agent should start at:

```txt
http://127.0.0.1:8000
```

Check health:

```txt
http://127.0.0.1:8000/health
```

Expected result:

```json
{
  "status": "ok",
  "tmdb_key_configured": true
}
```

If `tmdb_key_configured` is `false`, check your `scraper-agent/.env` file and restart Uvicorn.

---

## 8. Verify TMDB Scraper Directly

Test a Hollywood movie:

```txt
http://127.0.0.1:8000/debug/tmdb?query=Dune%20Part%20Two&region=US
```

Test an Indian/regional movie:

```txt
http://127.0.0.1:8000/debug/tmdb?query=Dhurandhar%3A%20The%20Revenge&region=IN
```

If these work, the admin scraper page should also work.

---

## 9. Seed Initial Data

If your project has the seed script installed, run:

```powershell
cd E:\Movie-Research
npm run seed
```

The seed creates sample movies and an admin user.

Default admin account:

```txt
Email: admin@cinevault.dev
Password: Admin123!
```

If `npm run seed` is unavailable, create a user through `/register` and promote the user manually in MongoDB Compass.

---

## 10. Create or Promote Admin User

Register from:

```txt
http://localhost:3000/register
```

Then open MongoDB Compass:

```txt
Database: cinevault
Collection: users
```

Update your user role:

```js
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin" } }
)
```

Logout and login again after changing the role.

Available roles:

```txt
user
writer
moderator
admin
```

---

## 11. Main App Routes

### Public / User Routes

```txt
/                         Home
/movies                   Movies and series library
/movies/[slug]            Movie detail page
/search                   Advanced search
/genres/[genre]           Genre pages
/profile                  User profile, watchlist, favorites
/blog                     Public blog listing
/blog/write               Write article
/blog/my                  User blog dashboard
/blog/[slug]              Blog detail
/blog/[slug]/edit         Edit own article
```

### Admin Routes

```txt
/admin/scraper            Python scraper workspace
/admin/blogs              Blog moderation and admin blog management
```

Admin tools are available from the profile dropdown.

---

## 12. Phase Feature Checks

### Phase 1 Checks

```txt
Home page loads
Register works
Login works
MongoDB users collection receives new users
Movies page displays movie cards
Movie detail pages open
Dark/light theme toggle works
```

### Phase 2 Checks

```txt
Python agent health endpoint works
Admin scraper page opens
Run scraper returns JSON
Import movie saves to MongoDB
Recent jobs list works
Retry failed jobs works
Delete recent jobs works
```

### Phase 3 Checks

```txt
Advanced search works
Genre filters work and clear correctly
Watchlist add/remove works
Watchlist Remove All works
Favorites work
Profile page opens from username menu
Movie detail page shows cast, crew, streaming, trailer, related titles
Admin movie deletion works from three-dot menu
```

### Phase 4 Checks

```txt
Blog listing page opens
Write article page opens fresh every time
Save draft works
Send for approval works with confirmation dialog
Users cannot directly publish articles
User blog dashboard shows draft/pending/approved/rejected status
Users with 3 rejected blogs cannot submit new blogs
Admin moderation page works
Approve/reject buttons hide after moderation
Admin can delete blogs
Likes and comments work on published blog pages
```

---

## 13. Blog Workflow

### User / Writer Flow

1. Open `/blog/write`.
2. Write article.
3. Click `Save draft` or `Send for approval`.
4. Submission requires confirmation.
5. Submitted article becomes `pending`.
6. User can track status at `/blog/my`.

### Admin / Moderator Flow

1. Open `/admin/blogs`.
2. Review pending articles.
3. Approve or reject.
4. Approved articles become public.
5. Rejected articles stay visible in the user dashboard as rejected.
6. Admin can delete articles if needed.

---

## 14. Scraper Workflow

1. Start Next.js.
2. Start FastAPI agent.
3. Open `/admin/scraper`.
4. Enter movie title and region.
5. Select sources.
6. Click `Run scraper`.
7. Review JSON preview.
8. Click `Import movie`.
9. Confirm import.
10. Movie appears on `/movies`.

Recent jobs support:

```txt
Retry failed job
Remove job
Import completed job
View selected JSON result
```

---

## 15. MongoDB Collections

The app uses these collections:

```txt
users
movies
series
blogs
reviews
scraperjobs
accounts
sessions
verificationtokens
```

Some Auth.js collections may appear only after OAuth/session usage.

---

## 16. Common Commands

### Start Next.js

```powershell
npm run dev
```

### Clean Next.js cache and restart

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### Start Python agent

```powershell
cd E:\Movie-Research\scraper-agent
.venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Install Python dependencies

```powershell
cd E:\Movie-Research\scraper-agent
.venv\Scripts\activate
pip install -r requirements.txt
```

### Seed database

```powershell
npm run seed
```

---

## 17. Troubleshooting

### Error: Could not reach the Python scraper

Check that Uvicorn is running:

```txt
http://127.0.0.1:8000/health
```

Check `.env.local`:

```env
PYTHON_AGENT_URL=http://127.0.0.1:8000
```

Restart both servers.

---

### Error: TMDB key not configured

Check:

```txt
E:\Movie-Research\scraper-agent\.env
```

Make sure it contains:

```env
TMDB_API_KEY=your-full-tmdb-v3-api-key
```

Then restart Uvicorn.

---

### Error: Network error while contacting TMDB

Possible causes:

```txt
Invalid or incomplete TMDB key
Internet connection issue
TMDB API temporarily unavailable
Firewall/proxy blocking Python requests
```

Test direct endpoint:

```txt
http://127.0.0.1:8000/debug/tmdb?query=Dune%20Part%20Two&region=US
```

---

### Error: MissingSchemaError for Movie/User

Restart Next.js after applying model-related updates:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

### Error: Element type is invalid

This usually means a default/named import mismatch.

Clear the cache:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

If it continues, check that shared components export both default and named exports where required.

---

### MongoDB changes not appearing

Check:

```txt
MONGODB_URI in .env.local
MongoDB server is running
Correct database is selected in Compass
Next.js was restarted after env changes
```

---

## 18. Deployment Notes

### Next.js

Deploy to Vercel.

Set these environment variables in Vercel:

```env
MONGODB_URI=
AUTH_SECRET=
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
PYTHON_AGENT_URL=https://your-python-agent-url
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Python Agent

Deploy to Railway, Render, or another Python hosting provider.

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set Python environment variables:

```env
TMDB_API_KEY=
TMDB_READ_ACCESS_TOKEN=
OMDB_API_KEY=
YOUTUBE_DATA_API_KEY=
ALLOWED_ORIGINS=https://your-domain.com
```

Update Vercel:

```env
PYTHON_AGENT_URL=https://your-python-agent-url
```

---

## 19. Recommended Local Development Startup Order

Use two terminals.

Terminal 1:

```powershell
cd E:\Movie-Research
npm run dev
```

Terminal 2:

```powershell
cd E:\Movie-Research\scraper-agent
.venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Then open:

```txt
http://localhost:3000
```

---

## 20. Final Verification Checklist

Before considering the setup complete, verify:

```txt
Next.js runs at http://localhost:3000
FastAPI runs at http://127.0.0.1:8000
MongoDB Compass shows cinevault database
User registration works
Admin role works
Movies page works
Movie deletion works for admin
Scraper fetch/import works
Watchlist and favorites work
Blog approval workflow works
Admin blog moderation works
Theme toggle works
Profile dropdown works
```

If all items pass, the local CineVault setup is complete.
