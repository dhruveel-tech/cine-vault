import type { FilterQuery } from "mongoose";
import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import Movie from "@/models/Movie";
import dbConnect from "@/lib/mongodb";
import { buildMovieFilter, getMovieSort, normalizeParam } from "@/lib/movie-queries";
import { serializeMovieCard } from "@/lib/serializers";
import MovieCard from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters = {
    q: normalizeParam(params.q),
    genre: normalizeParam(params.genre),
    type: normalizeParam(params.type),
    language: normalizeParam(params.language),
    platform: normalizeParam(params.platform),
    yearFrom: normalizeParam(params.yearFrom),
    yearTo: normalizeParam(params.yearTo),
    rating: normalizeParam(params.rating),
    status: normalizeParam(params.status)
  };
  const sort = normalizeParam(params.sort) ?? "newest";
  const hasFilters = Object.values(filters).some(Boolean);

  await dbConnect();
  const query: FilterQuery<any> = buildMovieFilter(filters);
  const [results, genres, languages, platforms] = await Promise.all([
    Movie.find(query).sort(getMovieSort(sort)).limit(60).lean(),
    Movie.distinct("genres"),
    Movie.distinct("languages"),
    Movie.distinct("ottPlatforms")
  ]);

  const movies = results.map(serializeMovieCard);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Advanced discovery</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Search CineVault</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Combine title, genre, year, language, OTT platform, content type, and rating filters to narrow the catalog.
        </p>
      </div>

      <Card className="mb-8 p-4 md:p-5">
        <form action="/search" method="get" className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={filters.q} placeholder="Search title, cast, crew, keywords..." className="pl-10" />
          </div>
          <Select name="genre" value={filters.genre} label="All genres" options={(genres as string[]).filter(Boolean).sort()} className="lg:col-span-2" />
          <Select name="language" value={filters.language} label="All languages" options={(languages as string[]).filter(Boolean).sort()} className="lg:col-span-2" />
          <Select name="platform" value={filters.platform} label="All platforms" options={(platforms as string[]).filter(Boolean).sort()} className="lg:col-span-2" />
          <select name="type" defaultValue={filters.type ?? ""} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 lg:col-span-2">
            <option value="">All types</option>
            <option value="movie">Movie</option>
            <option value="web_series">Web series</option>
            <option value="documentary">Documentary</option>
            <option value="anime">Anime</option>
            <option value="short_film">Short film</option>
          </select>
          <Input name="yearFrom" defaultValue={filters.yearFrom} placeholder="From year" className="lg:col-span-2" />
          <Input name="yearTo" defaultValue={filters.yearTo} placeholder="To year" className="lg:col-span-2" />
          <Input name="rating" defaultValue={filters.rating} placeholder="Min rating" className="lg:col-span-2" />
          <select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 lg:col-span-2">
            <option value="newest">Newest</option>
            <option value="rating">Highest rated</option>
            <option value="popular">Most popular</option>
            <option value="title">Title A-Z</option>
            <option value="oldest">Oldest</option>
          </select>
          <Button type="submit" className="lg:col-span-2">
            <Filter className="h-4 w-4" />
            Search
          </Button>
          {hasFilters ? (
            <Button asChild variant="outline" className="lg:col-span-2">
              <Link href="/search" replace><X className="h-4 w-4" /> Clear</Link>
            </Button>
          ) : null}
        </form>
      </Card>

      <div className="mb-5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{movies.length} results shown</span>
        <Link href="/movies" className="font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400">Browse full library</Link>
      </div>

      {movies.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
        </div>
      ) : (
        <Card className="border-dashed p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">No matching titles</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">Try clearing one or two filters, or import more movie data from the scraper.</p>
        </Card>
      )}
    </div>
  );
}

function Select({ name, value, label, options, className }: { name: string; value?: string; label: string; options: string[]; className?: string }) {
  return (
    <select name={name} defaultValue={value ?? ""} className={`h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className ?? ""}`}>
      <option value="">{label}</option>
      {options.slice(0, 80).map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}
