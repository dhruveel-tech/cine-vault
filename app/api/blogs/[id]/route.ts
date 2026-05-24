import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { buildExcerpt, normalizeTags, sanitizeHtml, serializeBlogDetail } from "@/lib/blog-utils";
import { blogWriteSchema } from "@/lib/blog-validation";
import Blog from "@/models/Blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function idFilter(id: string) {
  const filters: any[] = [{ slug: id }];
  if (/^[a-f\d]{24}$/i.test(id)) filters.push({ _id: id });
  return { $or: filters };
}

async function getBlog(id: string) {
  return Blog.findOne(idFilter(id))
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .populate("comments.user", "name avatar image role")
    .lean();
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;
  await dbConnect();

  const blog: any = await getBlog(id);
  if (!blog) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const viewerRole = session?.user?.role;
  const viewerId = session?.user?.id;
  const canViewUnpublished = viewerId && (String(blog.author?._id) === viewerId || viewerRole === "admin" || viewerRole === "moderator");

  if (blog.status !== "published" && !canViewUnpublished) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  if (blog.status === "published") {
    await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } });
    blog.views = Number(blog.views || 0) + 1;
  }

  blog.__viewerRole = viewerRole;
  return NextResponse.json({ blog: serializeBlogDetail(blog, viewerId) });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  const parsed = blogWriteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid article data." }, { status: 400 });
  }

  await dbConnect();
  const blog = await Blog.findOne(idFilter(id));
  if (!blog) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const role = session.user.role || "user";
  const canEdit = String(blog.author) === session.user.id || role === "admin" || role === "moderator";
  if (!canEdit) return NextResponse.json({ error: "You do not have permission to edit this article." }, { status: 403 });

  const rejectedCount = await Blog.countDocuments({ author: session.user.id, status: "rejected" });
  if (!["admin", "moderator"].includes(role) && parsed.data.status === "pending" && rejectedCount >= 3) {
    return NextResponse.json({ error: "Your article submissions are restricted because 3 of your previous articles were rejected." }, { status: 403 });
  }

  const data = parsed.data;
  const status = data.status === "pending" ? "pending" : "draft";

  blog.set({
    title: data.title,
    content: sanitizeHtml(data.content),
    excerpt: buildExcerpt(data.content, data.excerpt),
    coverImage: data.coverImage || "",
    category: data.category,
    tags: normalizeTags(data.tags),
    status,
    moderationNote: status === "pending" ? "" : blog.moderationNote,
    relatedMovie: data.relatedMovie || null
  });

  await blog.save();

  const populated: any = await getBlog(String(blog._id));
  populated.__viewerRole = role;

  return NextResponse.json({ blog: serializeBlogDetail(populated, session.user.id), requiresModeration: status === "pending" });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const blog = await Blog.findOne(idFilter(id)).select("author title");
  if (!blog) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const canDelete = String(blog.author) === session.user.id || session.user.role === "admin" || session.user.role === "moderator";
  if (!canDelete) return NextResponse.json({ error: "You do not have permission to delete this article." }, { status: 403 });

  await Blog.deleteOne({ _id: blog._id });
  return NextResponse.json({ ok: true, deletedId: String(blog._id) });
}
