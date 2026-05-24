export type ScraperSource = "tmdb" | "imdb" | "streaming" | "omdb";

export type ScraperStatus = "pending" | "running" | "completed" | "failed" | "imported";

export type ScraperJobDTO = {
  id: string;
  query: string;
  region: string;
  sources: string[];
  status: ScraperStatus;
  result?: MovieJSON | null;
  error?: string;
  importedMovie?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  importedAt?: string;
};

export type MovieJSON = {
  title: string;
  original_title?: string | null;
  content_type: "movie" | "web_series" | "documentary" | "anime" | "short_film";
  genres: string[];
  languages: string[];
  countries: string[];
  release_date?: string | null;
  release_year?: number | null;
  runtime_minutes?: number | null;
  status?: string | null;
  synopsis?: string | null;
  tagline?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_youtube_key?: string | null;
  cast: Array<{ name: string; character?: string | null; profile_url?: string | null; order?: number | null }>;
  crew: Array<{ name: string; job: string; department?: string | null }>;
  streaming_platforms: Array<{ platform: string; region: string; url?: string | null; type: "subscription" | "rent" | "buy" | "free" }>;
  ratings?: {
    imdb_score?: number | null;
    imdb_votes?: number | null;
    tmdb_score?: number | null;
    tmdb_votes?: number | null;
    rotten_tomatoes?: number | null;
  } | null;
  budget_usd?: number | null;
  box_office_worldwide_usd?: number | null;
  production_companies: string[];
  awards: Array<Record<string, unknown>>;
  keywords: string[];
  tmdb_id?: string | null;
  imdb_id?: string | null;
  data_sources: string[];
  scraped_at: string;
};
