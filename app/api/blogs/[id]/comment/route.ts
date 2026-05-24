import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { blogCommentSchema } from "@/lib/blog-validation";
import Blog from "@/models/Blog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const parsed = blogCommentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid comment." }, { status: 400 });

  const { id } = await params;
  await dbConnect();

  const blog = await Blog.findByIdAndUpdate(
    id,
    { $push: { comments: { user: session.user.id, text: parsed.data.text } } },
    { new: true }
  ).populate("comments.user", "name avatar image role");

  if (!blog) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const comment = blog.comments[blog.comments.length - 1] as any;
  return NextResponse.json(
    {
      comment: {
        id: String(comment._id),
        text: comment.text,
        createdAt: new Date(comment.createdAt).toISOString(),
        user: {
          id: String(comment.user?._id || session.user.id),
          name: comment.user?.name || session.user.name || "CineVault User",
          avatar: comment.user?.avatar,
          image: comment.user?.image,
          role: comment.user?.role
        }
      }
    },
    { status: 201 }
  );
}
