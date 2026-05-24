import { NextResponse } from "next/server";
import type { FilterQuery } from "mongoose";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { buildExcerpt, normalizeTags, sanitizeHtml, serializeBlogListItem } from "@/lib/blog-utils";
import { blogWriteSchema } from "@/lib/blog-validation";
import { slugify } from "@/lib/slug";
import Blog from "@/models/Blog";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogQuery = {
  status?: string;
  category?: string;
  q?: string;
  mine?: string;
  limit?: string;
  editorsPick?: string;
};

async function makeUniqueSlug(title: string) {
  const base = slugify(title) || "cinevault-article";
  let slug = base;
  let index = 1;

  while (await Blog.exists({ slug })) {
    index += 1;
    slug = `${base}-${index}`;
  }

  return slug;
}

async function rejectedCountForUser(userId: string) {
  return Blog.countDocuments({ author: userId, status: "rejected" });
}

export async function GET(request: Request) {
  await dbConnect();

  const session = await auth();
  const viewerRole = session?.user?.role;
  const viewerId = session?.user?.id;
  const { searchParams } = new URL(request.url);
  const query: BlogQuery = Object.fromEntries(searchParams.entries());

  const filter: FilterQuery<typeof Blog> = {};
  const canModerate = viewerRole === "admin" || viewerRole === "moderator";

  if (query.mine === "true") {
    if (!viewerId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    filter.author = viewerId;
  } else if (canModerate && query.status && ["draft", "pending", "published", "rejected"].includes(query.status)) {
    filter.status = query.status;
  } else if (canModerate && query.status === "all") {
    // Admin/moderator all-status view.
  } else {
    filter.status = "published";
  }

  if (query.category && query.category !== "all") filter.category = query.category;
  if (query.editorsPick === "true") filter.isEditorsPick = true;
  if (query.q) filter.$text = { $search: query.q };

  const limit = Math.min(Number(query.limit || 24), 80);
  const blogs = await Blog.find(filter)
    .sort({ status: 1, isEditorsPick: -1, publishedAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .lean();

  return NextResponse.json({ blogs: blogs.map(serializeBlogListItem) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  await dbConnect();

  const role = session.user.role || "user";
  const rejectedCount = await rejectedCountForUser(session.user.id);
  if (!["admin", "moderator"].includes(role) && rejectedCount >= 3) {
    return NextResponse.json({ error: "Your article submissions are restricted because 3 of your previous articles were rejected. Please contact a moderator before submitting more writing." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = blogWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid article data." }, { status: 400 });
  }

  const data = parsed.data;
  const slug = await makeUniqueSlug(data.title);
  const status = data.status === "pending" ? "pending" : "draft";

  const blog = await Blog.create({
    title: data.title,
    slug,
    content: sanitizeHtml(data.content),
    excerpt: buildExcerpt(data.content, data.excerpt),
    coverImage: data.coverImage || "",
    category: data.category,
    tags: normalizeTags(data.tags),
    status,
    author: session.user.id,
    relatedMovie: data.relatedMovie || null
  });

  await User.updateOne({ _id: session.user.id }, { $addToSet: { blogsWritten: blog._id } });

  const populated = await Blog.findById(blog._id)
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .lean();

  return NextResponse.json({ blog: serializeBlogListItem(populated), requiresModeration: status === "pending" }, { status: 201 });
}
