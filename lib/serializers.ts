import type { MovieCardDTO, MovieDetailDTO } from "@/types/movie.types";

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

export function serializeMovieCard(movie: any): MovieCardDTO {
  return {
    id: movie._id?.toString?.() ?? movie.id?.toString?.() ?? "",
    title: movie.title,
    slug: movie.slug,
    type: movie.type,
    releaseYear: movie.releaseYear,
    runtime: movie.runtime,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    genres: movie.genres ?? [],
    ratings: movie.ratings
  };
}

export function serializeMovieDetail(movie: any): MovieDetailDTO {
  return {
    ...serializeMovieCard(movie),
    originalTitle: movie.originalTitle,
    contentRating: movie.contentRating,
    languages: movie.languages ?? [],
    countries: movie.countries ?? [],
    releaseDate: isoDate(movie.releaseDate),
    status: movie.status,
    synopsis: movie.synopsis,
    tagline: movie.tagline,
    trailerKey: movie.trailerKey,
    cast: movie.cast ?? [],
    crew: movie.crew ?? [],
    streamingPlatforms: movie.streamingPlatforms ?? [],
    budget: movie.budget,
    boxOffice: movie.boxOffice,
    productionCompanies: movie.productionCompanies ?? [],
    distributors: movie.distributors ?? [],
    awards: movie.awards ?? [],
    keywords: movie.keywords ?? [],
    ottPlatforms: movie.ottPlatforms ?? [],
    tmdbId: movie.tmdbId,
    imdbId: movie.imdbId,
    dataSource: movie.dataSource,
    isVerified: movie.isVerified
  };
}
