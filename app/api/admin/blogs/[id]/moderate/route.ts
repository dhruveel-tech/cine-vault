import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { blogModerationSchema } from "@/lib/blog-validation";
import Blog from "@/models/Blog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!["admin", "moderator"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
  }

  const parsed = blogModerationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation update." }, { status: 400 });

  const { id } = await params;
  await dbConnect();

  const existing = await Blog.findById(id);
  if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const update: Record<string, unknown> = {
    status: parsed.data.status,
    moderationNote: parsed.data.moderationNote || ""
  };

  if (typeof parsed.data.isEditorsPick === "boolean") update.isEditorsPick = parsed.data.isEditorsPick;
  if (parsed.data.status === "published") update.publishedAt = new Date();
  if (parsed.data.status !== "published") {
    update.publishedAt = null;
    if (parsed.data.status === "rejected") update.isEditorsPick = false;
  }

  existing.set(update);
  await existing.save();

  return NextResponse.json({ ok: true, status: existing.status, isEditorsPick: existing.isEditorsPick });
}
