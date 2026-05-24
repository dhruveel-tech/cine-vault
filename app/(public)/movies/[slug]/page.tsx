import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import Movie from "@/models/Movie";
import dbConnect from "@/lib/mongodb";
import { serializeMovieCard, serializeMovieDetail } from "@/lib/serializers";
import { getMovieLibraryState } from "@/lib/user-library";
import MovieDetailHero from "@/components/movie/MovieDetailHero";
import CastGrid from "@/components/movie/CastGrid";
import CrewList from "@/components/movie/CrewList";
import MovieStatsPanel from "@/components/movie/MovieStatsPanel";
import RelatedMovies from "@/components/movie/RelatedMovies";
import StreamingAvailability from "@/components/movie/StreamingAvailability";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 86400;

type MovieDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MovieDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const movie = await Movie.findOne({ slug }).select("title synopsis posterUrl backdropUrl releaseYear").lean();

  if (!movie) return { title: "Movie not found" };

  return {
    title: `${movie.title} ${movie.releaseYear ? `(${movie.releaseYear})` : ""} | CineVault`,
    description: movie.synopsis,
    openGraph: {
      title: movie.title,
      description: movie.synopsis,
      images: [movie.backdropUrl, movie.posterUrl].filter(Boolean) as string[]
    }
  };
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { slug } = await params;
  await dbConnect();

  const rawMovie = await Movie.findOne({ slug }).lean();
  if (!rawMovie) notFound();

  const movie = serializeMovieDetail(rawMovie);
  const [libraryState, relatedRaw] = await Promise.all([
    getMovieLibraryState(movie.id),
    Movie.find({ _id: { $ne: rawMovie._id }, genres: { $in: movie.genres } })
      .sort({ "ratings.tmdb.score": -1, releaseYear: -1 })
      .limit(4)
      .lean()
  ]);

  const related = relatedRaw.map(serializeMovieCard);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": movie.type === "web_series" ? "TVSeries" : "Movie",
    name: movie.title,
    description: movie.synopsis,
    image: movie.posterUrl,
    datePublished: movie.releaseDate,
    genre: movie.genres,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    aggregateRating: movie.ratings?.tmdb?.score
      ? {
          "@type": "AggregateRating",
          ratingValue: movie.ratings.tmdb.score,
          ratingCount: movie.ratings.tmdb.votes ?? 1,
          bestRating: 10
        }
      : undefined
  };

  return (
    <div>
      <Script id="movie-json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MovieDetailHero movie={movie} libraryState={libraryState} />

      <div className="shell-container grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:py-12">
        <main className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">{movie.synopsis || "Synopsis will be added soon."}</p>
            </CardContent>
          </Card>

          <StreamingAvailability platforms={movie.streamingPlatforms} />
          <CastGrid cast={movie.cast} />
          <CrewList crew={movie.crew} />

          {movie.awards.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Awards and accolades</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {movie.awards.map((award) => (
                  <div key={`${award.name}-${award.category}-${award.year}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="font-bold text-slate-950 dark:text-white">{award.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{award.category || "Award"} {award.year ? `· ${award.year}` : ""}</p>
                    <Badge className="mt-3" variant={award.won ? "default" : "secondary"}>{award.won ? "Won" : "Nominated"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <RelatedMovies movies={related} />
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <MovieStatsPanel movie={movie} />
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Original title" value={movie.originalTitle || movie.title} />
              <DetailRow label="Type" value={movie.type.replace("_", " ")} />
              <DetailRow label="Status" value={movie.status || "TBA"} />
              <DetailRow label="Countries" value={movie.countries.join(", ") || "TBA"} />
              <DetailRow label="Content rating" value={movie.contentRating || "TBA"} />
              <DetailRow label="Data source" value={movie.dataSource || "manual"} />
            </CardContent>
          </Card>

          {movie.keywords.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {movie.keywords.slice(0, 18).map((keyword) => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-semibold capitalize text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}
