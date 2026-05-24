import type { Metadata } from "next";
import Link from "next/link";

import Movie from "@/models/Movie";
import dbConnect from "@/lib/mongodb";
import { escapeRegex, getMovieSort } from "@/lib/movie-queries";
import { serializeMovieCard } from "@/lib/serializers";
import MovieCard from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenrePageProps = {
  params: Promise<{ genre: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { genre } = await params;
  const decoded = decodeURIComponent(genre);
  return {
    title: `${decoded} movies | CineVault`,
    description: `Browse ${decoded} movies and series in the CineVault library.`
  };
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
  const { genre } = await params;
  const decoded = decodeURIComponent(genre);
  const queryParams = await searchParams;
  const sort = Array.isArray(queryParams.sort) ? queryParams.sort[0] : queryParams.sort;

  await dbConnect();
  const [results, relatedGenres] = await Promise.all([
    Movie.find({ genres: { $regex: `^${escapeRegex(decoded)}$`, $options: "i" } })
      .sort(getMovieSort(sort ?? "newest"))
      .limit(60)
      .lean(),
    Movie.distinct("genres")
  ]);

  const movies = results.map(serializeMovieCard);
  const alternatives = (relatedGenres as string[]).filter((item) => item && item.toLowerCase() !== decoded.toLowerCase()).sort().slice(0, 12);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Genre collection</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">{decoded}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Explore every title tagged with {decoded}. Sort by newest, rating, popularity, or title.
          </p>
        </div>
        <form action={`/genres/${encodeURIComponent(decoded)}`} method="get" className="flex gap-3">
          <select name="sort" defaultValue={sort ?? "newest"} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
            <option value="newest">Newest</option>
            <option value="rating">Highest rated</option>
            <option value="popular">Most popular</option>
            <option value="title">Title A-Z</option>
          </select>
          <Button type="submit">Apply</Button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {alternatives.map((item) => (
          <Button key={item} asChild variant="outline" size="sm">
            <Link href={`/genres/${encodeURIComponent(item)}`}>{item}</Link>
          </Button>
        ))}
      </div>

      {movies.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
        </div>
      ) : (
        <Card className="border-dashed p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">No titles found for {decoded}</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">Import more movies with this genre from the scraper, or browse the full library.</p>
          <Button asChild className="mt-6"><Link href="/movies">Browse movies</Link></Button>
        </Card>
      )}
    </div>
  );
}
