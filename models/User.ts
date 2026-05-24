import mongoose, { type InferSchemaType, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    emailVerified: { type: Date },
    passwordHash: { type: String, select: false },
    avatar: { type: String },
    image: { type: String },
    bio: { type: String, default: "" },
    role: {
      type: String,
      enum: ["user", "writer", "moderator", "admin"],
      default: "user",
      index: true
    },
    watchlist: [{ type: Schema.Types.ObjectId, ref: "Movie", index: true }],
    favorites: [{ type: Schema.Types.ObjectId, ref: "Movie", index: true }],
    watched: [{ type: Schema.Types.ObjectId, ref: "Movie", index: true }],
    blogsWritten: [{ type: Schema.Types.ObjectId, ref: "Blog" }]
  },
  {
    timestamps: true,
    strict: false
  }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

if (process.env.NODE_ENV === "development" && mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
