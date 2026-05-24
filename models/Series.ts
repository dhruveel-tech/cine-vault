import mongoose, { type InferSchemaType, Schema } from "mongoose";

import { movieBaseDefinition } from "@/models/Movie";

const seasonSchema = new Schema(
  {
    seasonNumber: { type: Number, required: true },
    name: { type: String, trim: true },
    episodeCount: { type: Number, default: 0 },
    airDate: { type: Date },
    posterUrl: { type: String },
    overview: { type: String }
  },
  { _id: false }
);

const SeriesSchema = new Schema(
  {
    ...movieBaseDefinition,
    type: {
      type: String,
      enum: ["web_series", "anime", "documentary"],
      default: "web_series",
      index: true
    },
    totalSeasons: { type: Number, default: 0 },
    totalEpisodes: { type: Number, default: 0 },
    episodeRuntime: { type: Number },
    network: { type: String, trim: true },
    firstAirDate: { type: Date },
    lastAirDate: { type: Date },
    seasons: [seasonSchema]
  },
  { timestamps: true }
);

SeriesSchema.index({ title: "text", synopsis: "text", genres: "text", keywords: "text" });
SeriesSchema.index({ releaseYear: -1, "ratings.tmdb.score": -1 });

export type SeriesDocument = InferSchemaType<typeof SeriesSchema>;

const Series = mongoose.models.Series || mongoose.model("Series", SeriesSchema);

export default Series;
