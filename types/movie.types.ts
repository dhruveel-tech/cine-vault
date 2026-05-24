export type ContentType =
  | "movie"
  | "web_series"
  | "documentary"
  | "short_film"
  | "anime";

export type ContentRating =
  | "G"
  | "PG"
  | "PG-13"
  | "R"
  | "NC-17"
  | "TV-MA"
  | "TV-14";

export type MovieStatus = "released" | "upcoming" | "in_production" | "cancelled";

export type MovieRatingsDTO = {
  tmdb?: { score?: number; votes?: number };
  imdb?: { score?: number; votes?: number };
  rottenTomatoes?: { tomatometer?: number; audience?: number };
};

export type MovieCardDTO = {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  releaseYear?: number;
  runtime?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres: string[];
  ratings?: MovieRatingsDTO;
};

export type MovieDetailDTO = MovieCardDTO & {
  originalTitle?: string;
  contentRating?: ContentRating;
  languages: string[];
  countries: string[];
  releaseDate?: string;
  status?: MovieStatus;
  synopsis?: string;
  tagline?: string;
  trailerKey?: string;
  cast: Array<{
    name: string;
    character?: string;
    profileUrl?: string;
    order?: number;
  }>;
  crew: Array<{
    name: string;
    job: string;
    department?: string;
  }>;
  streamingPlatforms: Array<{
    name: string;
    region: string;
    url?: string;
    type: "subscription" | "rent" | "buy" | "free";
  }>;
  budget?: number;
  boxOffice?: {
    domestic?: number;
    worldwide?: number;
  };
  productionCompanies: string[];
  distributors: string[];
  awards: Array<{
    name: string;
    category?: string;
    year?: number;
    won?: boolean;
  }>;
  keywords: string[];
  ottPlatforms: string[];
  tmdbId?: string;
  imdbId?: string;
  dataSource?: "tmdb" | "scraper" | "manual";
  isVerified?: boolean;
};
