import { z } from "zod";

export const blogCategorySchema = z.enum(["review", "analysis", "news", "top-list", "opinion"]);
export const publicBlogStatusSchema = z.enum(["draft", "pending"]);

export const blogWriteSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(180),
  content: z.string().trim().min(20, "Article content is too short."),
  excerpt: z.string().trim().max(260).optional().default(""),
  coverImage: z.string().trim().url("Cover image must be a valid URL.").optional().or(z.literal("")),
  category: blogCategorySchema,
  tags: z.array(z.string().trim().max(40)).max(8).optional().default([]),
  relatedMovie: z.string().trim().optional().nullable(),
  status: publicBlogStatusSchema.default("draft")
});

export const blogModerationSchema = z.object({
  status: z.enum(["published", "rejected", "pending", "draft"]),
  isEditorsPick: z.boolean().optional(),
  moderationNote: z.string().trim().max(500).optional().default("")
});

export const blogCommentSchema = z.object({
  text: z.string().trim().min(2, "Comment is too short.").max(1200, "Comment is too long.")
});
