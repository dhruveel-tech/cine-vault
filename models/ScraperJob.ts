import mongoose, { type InferSchemaType, Schema } from "mongoose";

const ScraperJobSchema = new Schema(
  {
    query: { type: String, required: true, trim: true, index: true },
    region: { type: String, default: "US", trim: true, uppercase: true },
    sources: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "imported"],
      default: "pending",
      index: true
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    importedMovie: { type: Schema.Types.ObjectId, ref: "Movie" },
    startedAt: { type: Date },
    completedAt: { type: Date },
    importedAt: { type: Date }
  },
  { timestamps: true }
);

ScraperJobSchema.index({ createdAt: -1 });
ScraperJobSchema.index({ query: "text", error: "text" });

export type ScraperJobDocument = InferSchemaType<typeof ScraperJobSchema>;

const ScraperJob = mongoose.models.ScraperJob || mongoose.model("ScraperJob", ScraperJobSchema);

export default ScraperJob;
