import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const blog = await Blog.findById(id).select("likes");
  if (!blog) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const userObjectId = new Types.ObjectId(session.user.id);
  const liked = blog.likes.some((likeId: Types.ObjectId) => String(likeId) === session.user.id);

  await Blog.updateOne(
    { _id: id },
    liked ? { $pull: { likes: userObjectId } } : { $addToSet: { likes: userObjectId } }
  );

  const likesCount = Math.max(0, blog.likes.length + (liked ? -1 : 1));
  return NextResponse.json({ liked: !liked, likesCount });
}
