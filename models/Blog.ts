import mongoose, { type InferSchemaType, Schema } from "mongoose";

// Register referenced models before any Blog populate() calls run.
// This prevents MissingSchemaError for refs such as author and relatedMovie
// in App Router server pages/API routes that import Blog directly.
import "./User";
import "./Movie";

const BlogCommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1200 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 260 },
    coverImage: { type: String, default: "" },

    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    relatedMovie: { type: Schema.Types.ObjectId, ref: "Movie", default: null, index: true },

    tags: [{ type: String, trim: true, lowercase: true }],
    category: {
      type: String,
      enum: ["review", "analysis", "news", "top-list", "opinion"],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft",
      index: true
    },
    moderationNote: { type: String, default: "", maxlength: 500 },
    isEditorsPick: { type: Boolean, default: false, index: true },

    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [BlogCommentSchema],

    readTime: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

BlogSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ category: 1, status: 1, publishedAt: -1 });
BlogSchema.index({ author: 1, updatedAt: -1 });

BlogSchema.pre("validate", function setComputedBlogFields() {
  const text = String(this.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  this.readTime = Math.max(1, Math.ceil(words / 200));

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.status !== "published") {
    this.publishedAt = null;
  }
});

export type BlogDocument = InferSchemaType<typeof BlogSchema>;

if (process.env.NODE_ENV === "development" && mongoose.models.Blog) {
  delete mongoose.models.Blog;
}

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);

export default Blog;
