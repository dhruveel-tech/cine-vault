import type { MovieJSON } from "@/types/scraper.types";

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function cleanArray(values?: Array<string | null | undefined>) {
  return Array.from(new Set((values ?? []).map((value) => value?.trim()).filter(Boolean) as string[]));
}

export function mapMovieJsonToMoviePayload(movie: MovieJSON) {
  const ottPlatforms = cleanArray(movie.streaming_platforms?.map((item) => item.platform));

  return {
    title: movie.title,
    originalTitle: cleanString(movie.original_title),
    type: movie.content_type,
    genres: cleanArray(movie.genres),
    languages: cleanArray(movie.languages),
    countries: cleanArray(movie.countries),
    releaseDate: movie.release_date || undefined,
    releaseYear: movie.release_year || undefined,
    runtime: movie.runtime_minutes || undefined,
    status: movie.status === "upcoming" || movie.status === "in_production" ? movie.status : "released",
    synopsis: cleanString(movie.synopsis),
    tagline: cleanString(movie.tagline),
    posterUrl: cleanString(movie.poster_url),
    backdropUrl: cleanString(movie.backdrop_url),
    trailerKey: cleanString(movie.trailer_youtube_key),
    cast: (movie.cast ?? []).slice(0, 30).map((member) => ({
      name: member.name,
      character: cleanString(member.character),
      profileUrl: cleanString(member.profile_url),
      order: member.order ?? undefined
    })),
    crew: (movie.crew ?? []).slice(0, 40).map((member) => ({
      name: member.name,
      job: member.job,
      department: cleanString(member.department)
    })),
    streamingPlatforms: (movie.streaming_platforms ?? []).map((item) => ({
      name: item.platform,
      region: item.region,
      url: cleanString(item.url),
      type: item.type
    })),
    ratings: {
      imdb: {
        score: movie.ratings?.imdb_score ?? undefined,
        votes: movie.ratings?.imdb_votes ?? undefined
      },
      tmdb: {
        score: movie.ratings?.tmdb_score ?? undefined,
        votes: movie.ratings?.tmdb_votes ?? undefined
      },
      rottenTomatoes: {
        tomatometer: movie.ratings?.rotten_tomatoes ?? undefined
      }
    },
    budget: movie.budget_usd ?? undefined,
    boxOffice: {
      worldwide: movie.box_office_worldwide_usd ?? undefined
    },
    productionCompanies: cleanArray(movie.production_companies),
    distributors: [],
    awards: movie.awards ?? [],
    keywords: cleanArray(movie.keywords),
    ottPlatforms,
    tmdbId: movie.tmdb_id ? String(movie.tmdb_id) : undefined,
    imdbId: cleanString(movie.imdb_id),
    dataSource: "scraper" as const,
    isVerified: false
  };
}
