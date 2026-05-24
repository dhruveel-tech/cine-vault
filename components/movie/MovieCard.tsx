import { Calendar, Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { MovieCardDTO } from "@/types/movie.types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function contentTypeLabel(value: string) {
  return value.replace("_", " ");
}

export default function MovieCard({ movie }: { movie: MovieCardDTO }) {
  const rating = movie.ratings?.tmdb?.score ?? movie.ratings?.imdb?.score;

  return (
    <Link href={`/movies/${movie.slug}`} className="group block h-full rounded-[1.7rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950" aria-label={`View ${movie.title}`}>
      <Card className="h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10 active:translate-y-0 active:scale-[0.99] dark:hover:border-blue-500/60 dark:hover:shadow-black/30">
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Poster coming soon
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

          {rating ? (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-slate-950 shadow-sm dark:bg-slate-950/90 dark:text-white">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {movie.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-950 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {movie.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {movie.releaseYear ?? "TBA"}
            </span>
            {movie.runtime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {movie.runtime}m
              </span>
            ) : null}
            <span className="capitalize">{contentTypeLabel(movie.type)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
