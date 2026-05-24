import type { ScraperJobDTO } from "@/types/scraper.types";

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

export function serializeScraperJob(job: any): ScraperJobDTO {
  return {
    id: job._id?.toString?.() ?? job.id?.toString?.() ?? "",
    query: job.query,
    region: job.region,
    sources: job.sources ?? [],
    status: job.status,
    result: job.result ?? null,
    error: job.error,
    importedMovie: job.importedMovie?.toString?.(),
    createdAt: isoDate(job.createdAt),
    startedAt: isoDate(job.startedAt),
    completedAt: isoDate(job.completedAt),
    importedAt: isoDate(job.importedAt)
  };
}
