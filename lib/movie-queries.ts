import type { FilterQuery } from "mongoose";

export type MovieSearchFilters = {
  q?: string | null;
  genre?: string | null;
  type?: string | null;
  language?: string | null;
  platform?: string | null;
  yearFrom?: string | number | null;
  yearTo?: string | number | null;
  rating?: string | number | null;
  status?: string | null;
};

export function normalizeParam(value: string | string[] | undefined) {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.trim() || undefined;
}

function numberValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getMovieSort(sort?: string | null) {
  switch (sort) {
    case "rating":
      return { "ratings.tmdb.score": -1, "ratings.imdb.score": -1, releaseYear: -1 };
    case "oldest":
      return { releaseYear: 1, createdAt: 1 };
    case "title":
      return { title: 1 };
    case "popular":
      return { "ratings.tmdb.votes": -1, "ratings.imdb.votes": -1, "ratings.tmdb.score": -1 };
    case "newest":
    default:
      return { releaseYear: -1, releaseDate: -1, createdAt: -1 };
  }
}

export function buildMovieFilter(filters: MovieSearchFilters): FilterQuery<any> {
  const query: FilterQuery<any> = {};
  const q = filters.q?.trim();
  const genre = filters.genre?.trim();
  const type = filters.type?.trim();
  const language = filters.language?.trim();
  const platform = filters.platform?.trim();
  const status = filters.status?.trim();
  const yearFrom = numberValue(filters.yearFrom);
  const yearTo = numberValue(filters.yearTo);
  const rating = numberValue(filters.rating);

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { originalTitle: { $regex: q, $options: "i" } },
      { synopsis: { $regex: q, $options: "i" } },
      { genres: { $regex: q, $options: "i" } },
      { languages: { $regex: q, $options: "i" } },
      { countries: { $regex: q, $options: "i" } },
      { keywords: { $regex: q, $options: "i" } },
      { "cast.name": { $regex: q, $options: "i" } },
      { "crew.name": { $regex: q, $options: "i" } }
    ];
  }

  if (genre) query.genres = { $regex: `^${escapeRegex(genre)}$`, $options: "i" };
  if (type) query.type = type;
  if (language) query.languages = { $regex: `^${escapeRegex(language)}$`, $options: "i" };
  if (platform) {
    query.$or = [
      ...(query.$or ?? []),
      { ottPlatforms: { $regex: `^${escapeRegex(platform)}$`, $options: "i" } },
      { "streamingPlatforms.name": { $regex: `^${escapeRegex(platform)}$`, $options: "i" } }
    ];
  }
  if (status) query.status = status;

  if (yearFrom || yearTo) {
    query.releaseYear = {};
    if (yearFrom) query.releaseYear.$gte = yearFrom;
    if (yearTo) query.releaseYear.$lte = yearTo;
  }

  if (rating) {
    query.$or = [
      ...(query.$or ?? []),
      { "ratings.tmdb.score": { $gte: rating } },
      { "ratings.imdb.score": { $gte: rating } }
    ];
  }

  return query;
}

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
