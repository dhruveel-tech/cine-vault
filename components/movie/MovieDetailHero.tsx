import type { ComponentType } from "react";
import Image from "next/image";
import { CalendarDays, Clock, ShieldCheck, Star } from "lucide-react";

import type { MovieDetailDTO } from "@/types/movie.types";
import { Badge } from "@/components/ui/badge";
import TrailerModal from "@/components/movie/TrailerModal";
import LibraryActions from "@/components/movie/LibraryActions";

type Props = {
  movie: MovieDetailDTO;
  libraryState: {
    isAuthenticated: boolean;
    isInWatchlist: boolean;
    isFavorite: boolean;
  };
};

export default function MovieDetailHero({ movie, libraryState }: Props) {
  const rating = movie.ratings?.tmdb?.score ?? movie.ratings?.imdb?.score;

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white dark:border-slate-800">
      {movie.backdropUrl ? (
        <Image
          src={movie.backdropUrl}
          alt={`${movie.title} backdrop`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.32),transparent_34%),linear-gradient(90deg,rgba(2,6,23,0.98),rgba(2,6,23,0.78),rgba(2,6,23,0.96))]" />

      <div className="shell-container relative grid gap-8 py-12 md:grid-cols-[260px_1fr] md:py-16 lg:py-20">
        <div className="relative aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/40">
          {movie.posterUrl ? (
            <Image src={movie.posterUrl} alt={`${movie.title} poster`} fill priority sizes="260px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">Poster coming soon</div>
          )}
        </div>

        <div className="flex flex-col justify-end pb-2">
          <div className="mb-4 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Badge key={genre} variant="secondary">{genre}</Badge>
            ))}
          </div>

          <h1 className="max-w-5xl text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">{movie.title}</h1>
          {movie.tagline ? <p className="mt-4 max-w-3xl text-lg italic text-blue-100/90 md:text-xl">{movie.tagline}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-blue-50/90">
            <InfoChip icon={CalendarDays} label={movie.releaseYear?.toString() ?? "Year TBA"} />
            <InfoChip icon={Clock} label={movie.runtime ? `${movie.runtime} min` : "Runtime TBA"} />
            <InfoChip icon={ShieldCheck} label={movie.contentRating ?? "Not rated"} />
            {rating ? <InfoChip icon={Star} label={`${rating.toFixed(1)} rating`} /> : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <TrailerModal trailerKey={movie.trailerKey} title={movie.title} />
            <LibraryActions
              movieId={movie.id}
              isAuthenticated={libraryState.isAuthenticated}
              initialWatchlist={libraryState.isInWatchlist}
              initialFavorite={libraryState.isFavorite}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoChip({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-medium backdrop-blur-md">
      <Icon className="h-4 w-4 text-blue-300" />
      {label}
    </span>
  );
}
