import { z } from "zod";

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();
const optionalDate = z.union([z.coerce.date(), z.literal(""), z.null()]).optional();

export const contentTypeSchema = z.enum([
  "movie",
  "web_series",
  "documentary",
  "short_film",
  "anime"
]);

export const movieCreateSchema = z.object({
  title: z.string().min(1).max(220),
  originalTitle: z.string().max(220).optional(),
  slug: z.string().max(260).optional(),
  type: contentTypeSchema.default("movie"),
  contentRating: z
    .enum(["G", "PG", "PG-13", "R", "NC-17", "TV-MA", "TV-14"])
    .optional(),
  genres: z.array(z.string().min(1).max(80)).default([]),
  languages: z.array(z.string().min(1).max(80)).default([]),
  countries: z.array(z.string().min(1).max(80)).default([]),
  releaseDate: optionalDate,
  releaseYear: z.coerce.number().int().min(1888).max(2200).optional(),
  runtime: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["released", "upcoming", "in_production", "cancelled"])
    .default("released"),
  synopsis: z.string().max(5000).optional(),
  tagline: z.string().max(500).optional(),
  posterUrl: optionalUrl,
  backdropUrl: optionalUrl,
  trailerKey: z.string().max(120).optional(),
  cast: z
    .array(
      z.object({
        name: z.string().min(1),
        character: z.string().optional(),
        profileUrl: optionalUrl,
        order: z.coerce.number().int().optional()
      })
    )
    .default([]),
  crew: z
    .array(
      z.object({
        name: z.string().min(1),
        job: z.string().min(1),
        department: z.string().optional()
      })
    )
    .default([]),
  streamingPlatforms: z
    .array(
      z.object({
        name: z.string().min(1),
        region: z.string().min(2).max(8),
        url: optionalUrl,
        type: z.enum(["subscription", "rent", "buy", "free"])
      })
    )
    .default([]),
  ratings: z
    .object({
      imdb: z
        .object({
          score: z.coerce.number().min(0).max(10).optional(),
          votes: z.coerce.number().int().min(0).optional()
        })
        .optional(),
      tmdb: z
        .object({
          score: z.coerce.number().min(0).max(10).optional(),
          votes: z.coerce.number().int().min(0).optional()
        })
        .optional(),
      rottenTomatoes: z
        .object({
          tomatometer: z.coerce.number().min(0).max(100).optional(),
          audience: z.coerce.number().min(0).max(100).optional()
        })
        .optional()
    })
    .optional(),
  budget: z.coerce.number().int().min(0).optional(),
  boxOffice: z
    .object({
      domestic: z.coerce.number().int().min(0).optional(),
      worldwide: z.coerce.number().int().min(0).optional()
    })
    .optional(),
  productionCompanies: z.array(z.string()).default([]),
  distributors: z.array(z.string()).default([]),
  awards: z
    .array(
      z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        year: z.coerce.number().int().optional(),
        won: z.boolean().optional()
      })
    )
    .default([]),
  keywords: z.array(z.string()).default([]),
  ottPlatforms: z.array(z.string()).default([]),
  tmdbId: z.string().optional(),
  imdbId: z.string().optional(),
  dataSource: z.enum(["tmdb", "scraper", "manual"]).default("manual"),
  isVerified: z.boolean().default(false)
});

export const movieUpdateSchema = movieCreateSchema.partial();
