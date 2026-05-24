import type { FilterQuery } from "mongoose";
import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";

import Movie from "@/models/Movie";
import dbConnect from "@/lib/mongodb";
import { serializeMovieCard } from "@/lib/serializers";
import MoviesGridClient from "@/components/movie/MoviesGridClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MoviesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function contentTypeLabel(value: string) {
  return value.replace("_", " ");
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const q = getParam(params.q)?.trim();
  const genre = getParam(params.genre)?.trim();
  const type = getParam(params.type)?.trim();
  const hasActiveFilters = Boolean(q || genre || type);
  const filterFormKey = JSON.stringify({ q: q ?? "", genre: genre ?? "", type: type ?? "" });
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  await dbConnect();

  const query: FilterQuery<any> = {};

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { originalTitle: { $regex: q, $options: "i" } },
      { synopsis: { $regex: q, $options: "i" } },
      { genres: { $regex: q, $options: "i" } },
      { keywords: { $regex: q, $options: "i" } }
    ];
  }

  if (genre) query.genres = { $regex: genre, $options: "i" };
  if (type) query.type = type;

  const [results, genres] = await Promise.all([
    Movie.find(query).sort({ releaseYear: -1, createdAt: -1 }).limit(48).lean(),
    Movie.distinct("genres")
  ]);

  const movies = results.map(serializeMovieCard);
  const genreOptions = (genres as string[]).filter(Boolean).sort().slice(0, 20);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">CineVault library</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
            Movies and series
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Search by title, synopsis, genre, keyword, or content type. Filters are designed to keep discovery fast and simple.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-2xl font-black text-slate-950 dark:text-white">{movies.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">matching results</p>
        </div>
      </div>

      <Card className="mb-8 p-4 md:p-5">
        <form key={filterFormKey} action="/movies" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_190px_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" placeholder="Search title, synopsis, genre..." defaultValue={q} className="pl-10" />
          </div>

          <select
            name="genre"
            defaultValue={genre ?? ""}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="">All genres</option>
            {genreOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            name="type"
            defaultValue={type ?? ""}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
          >
            <option value="">All types</option>
            <option value="movie">Movie</option>
            <option value="web_series">Web series</option>
            <option value="documentary">Documentary</option>
            <option value="anime">Anime</option>
            <option value="short_film">Short film</option>
          </select>

          <Button type="submit">
            <Filter className="h-4 w-4" />
            Apply
          </Button>

          {hasActiveFilters ? (
            <Button asChild variant="outline">
              <Link href="/movies" replace>
                <X className="h-4 w-4" />
                Clear
              </Link>
            </Button>
          ) : null}
        </form>

        {hasActiveFilters ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
            {q ? <ActivePill label={`Search: ${q}`} /> : null}
            {genre ? <ActivePill label={`Genre: ${genre}`} /> : null}
            {type ? <ActivePill label={`Type: ${contentTypeLabel(type)}`} /> : null}
          </div>
        ) : null}
      </Card>

      {movies.length > 0 ? (
        <MoviesGridClient movies={movies} isAdmin={isAdmin} />
      ) : (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">No matching movies found</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
            Try a different keyword, remove a filter, or add more titles to your CineVault database.
          </p>
          {hasActiveFilters ? (
            <Button asChild className="mt-6" variant="secondary">
              <Link href="/movies" replace>Reset filters</Link>
            </Button>
          ) : null}
        </Card>
      )}
    </div>
  );
}

function ActivePill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {label}
    </span>
  );
}
