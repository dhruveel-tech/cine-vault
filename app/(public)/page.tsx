import Link from "next/link";
import { ArrowRight, CalendarClock, Film, Search, Sparkles } from "lucide-react";

import Movie from "@/models/Movie";
import dbConnect from "@/lib/mongodb";
import { cached } from "@/lib/cache";
import { serializeMovieCard } from "@/lib/serializers";
import MovieCard from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getHomeData() {
  return cached(
    "home:phase3:v1",
    async () => {
      await dbConnect();
      const now = new Date();
      const [trending, upcoming, streaming, genres] = await Promise.all([
        Movie.find({}).sort({ "ratings.tmdb.votes": -1, "ratings.tmdb.score": -1, releaseYear: -1 }).limit(8).lean(),
        Movie.find({ $or: [{ status: "upcoming" }, { releaseDate: { $gte: now } }] }).sort({ releaseDate: 1, releaseYear: 1 }).limit(8).lean(),
        Movie.find({ streamingPlatforms: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).limit(8).lean(),
        Movie.distinct("genres")
      ]);

      return {
        trending: trending.map(serializeMovieCard),
        upcoming: upcoming.map(serializeMovieCard),
        streaming: streaming.map(serializeMovieCard),
        genres: (genres as string[]).filter(Boolean).sort().slice(0, 14)
      };
    },
    { ttlSeconds: 3600 }
  );
}

export default async function HomePage() {
  const { trending, upcoming, streaming, genres } = await getHomeData();
  const heroMovie = trending[0] ?? streaming[0] ?? upcoming[0];

  return (
    <div>
      <section className="shell-container grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_520px] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            Phase 3 discovery is live
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 dark:text-white md:text-7xl">
            Research films, compare ratings, and build your watchlist.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Explore trending titles, upcoming releases, genre collections, streaming availability, trailers, cast, crew, and personalized favorites from one clean workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/search"><Search className="h-4 w-4" /> Advanced search</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/movies">Browse movies <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-3 shadow-2xl shadow-blue-950/10 dark:shadow-blue-950/30">
          {heroMovie ? (
            <MovieCard movie={heroMovie} />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-200 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Import movies from the scraper to populate CineVault.
            </div>
          )}
        </Card>
      </section>

      <section className="shell-container space-y-10 pb-14">
        <FeatureRow />
        <GenreSection genres={genres} />
        <MovieRail title="Trending now" eyebrow="Popular research picks" movies={trending} href="/movies?sort=popular" />
        <MovieRail title="Upcoming releases" eyebrow="Coming soon" movies={upcoming} href="/search?status=upcoming" />
        <MovieRail title="New on streaming" eyebrow="OTT availability" movies={streaming} href="/search?platform=" />
      </section>
    </div>
  );
}

function FeatureRow() {
  const items = [
    { icon: Film, label: "Deep details", text: "Cast, crew, budget, awards, ratings, and keywords." },
    { icon: Search, label: "Advanced search", text: "Filter by genre, year, language, platform, and rating." },
    { icon: CalendarClock, label: "Hot data cached", text: "Trending and home data are cached for fast discovery." }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <item.icon className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{item.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.text}</p>
        </Card>
      ))}
    </div>
  );
}

function GenreSection({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">Browse faster</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Popular genres</h2>
        </div>
        <Button asChild variant="outline"><Link href="/movies">Open library</Link></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Button key={genre} asChild variant="secondary" size="sm">
            <Link href={`/genres/${encodeURIComponent(genre)}`}>{genre}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}

function MovieRail({ title, eyebrow, movies, href }: { title: string; eyebrow: string; movies: any[]; href: string }) {
  if (movies.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
        </div>
        <Button asChild variant="outline"><Link href={href}>See all <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {movies.slice(0, 4).map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </section>
  );
}
