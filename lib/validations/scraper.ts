import { z } from "zod";

export const scraperTriggerSchema = z.object({
  query: z.string().min(1, "Movie title is required").max(220),
  region: z.string().min(2).max(8).default("US"),
  sources: z
    .array(z.enum(["tmdb", "imdb", "streaming", "omdb"]))
    .min(1)
    .default(["tmdb", "streaming"])
});

export type ScraperTriggerInput = z.infer<typeof scraperTriggerSchema>;
