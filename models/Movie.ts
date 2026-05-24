import mongoose, { type InferSchemaType, Schema } from "mongoose";

const castMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    character: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    order: { type: Number }
  },
  { _id: false }
);

const crewMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    job: { type: String, required: true, trim: true },
    department: { type: String, trim: true }
  },
  { _id: false }
);

const streamingPlatformSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true, uppercase: true },
    url: { type: String, trim: true },
    type: {
      type: String,
      enum: ["subscription", "rent", "buy", "free"],
      required: true
    }
  },
  { _id: false }
);

const awardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    year: { type: Number },
    won: { type: Boolean, default: false }
  },
  { _id: false }
);

export const movieBaseDefinition = {
  title: { type: String, required: true, trim: true, index: true },
  originalTitle: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  type: {
    type: String,
    enum: ["movie", "web_series", "documentary", "short_film", "anime"],
    default: "movie",
    index: true
  },
  contentRating: {
    type: String,
    enum: ["G", "PG", "PG-13", "R", "NC-17", "TV-MA", "TV-14"]
  },
  genres: [{ type: String, trim: true, index: true }],
  languages: [{ type: String, trim: true, index: true }],
  countries: [{ type: String, trim: true }],
  releaseDate: { type: Date, index: true },
  releaseYear: { type: Number, index: true },
  runtime: { type: Number },
  status: {
    type: String,
    enum: ["released", "upcoming", "in_production", "cancelled"],
    default: "released",
    index: true
  },
  synopsis: { type: String },
  tagline: { type: String },
  posterUrl: { type: String },
  backdropUrl: { type: String },
  trailerKey: { type: String },
  cast: [castMemberSchema],
  crew: [crewMemberSchema],
  streamingPlatforms: [streamingPlatformSchema],
  ratings: {
    imdb: {
      score: { type: Number, min: 0, max: 10 },
      votes: { type: Number, min: 0 }
    },
    tmdb: {
      score: { type: Number, min: 0, max: 10 },
      votes: { type: Number, min: 0 }
    },
    rottenTomatoes: {
      tomatometer: { type: Number, min: 0, max: 100 },
      audience: { type: Number, min: 0, max: 100 }
    }
  },
  budget: { type: Number, min: 0 },
  boxOffice: {
    domestic: { type: Number, min: 0 },
    worldwide: { type: Number, min: 0 }
  },
  productionCompanies: [{ type: String, trim: true }],
  distributors: [{ type: String, trim: true }],
  awards: [awardSchema],
  keywords: [{ type: String, trim: true, index: true }],
  ottPlatforms: [{ type: String, trim: true, index: true }],
  tmdbId: { type: String, sparse: true, index: true },
  imdbId: { type: String, sparse: true, index: true },
  dataSource: {
    type: String,
    enum: ["tmdb", "scraper", "manual"],
    default: "manual"
  },
  isVerified: { type: Boolean, default: false, index: true }
};

const MovieSchema = new Schema(movieBaseDefinition, {
  timestamps: true
});

MovieSchema.index({ title: "text", synopsis: "text", genres: "text", keywords: "text" });
MovieSchema.index({ releaseYear: -1, "ratings.tmdb.score": -1 });

MovieSchema.pre("validate", function setReleaseYear() {
  if (!this.releaseYear && this.releaseDate) {
    this.releaseYear = this.releaseDate.getFullYear();
  }
});

export type MovieDocument = InferSchemaType<typeof MovieSchema>;

if (process.env.NODE_ENV === "development" && mongoose.models.Movie) {
  delete mongoose.models.Movie;
}

const Movie = mongoose.models.Movie || mongoose.model("Movie", MovieSchema);

export default Movie;
