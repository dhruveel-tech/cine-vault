import type { MovieCardDTO } from "@/types/movie.types";
import MovieCard from "@/components/movie/MovieCard";
import { Card } from "@/components/ui/card";

export default function RelatedMovies({ movies }: { movies: MovieCardDTO[] }) {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">More to explore</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Related titles</h2>
      </div>
      <Card className="p-4 md:p-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {movies.slice(0, 4).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </Card>
    </section>
  );
}
