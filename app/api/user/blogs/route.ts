import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeBlogListItem } from "@/lib/blog-utils";
import Blog from "@/models/Blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  await dbConnect();
  const [blogs, rejectedCount] = await Promise.all([
    Blog.find({ author: session.user.id })
      .sort({ updatedAt: -1 })
      .populate("author", "name email avatar image role")
      .populate("relatedMovie", "title slug releaseYear posterUrl")
      .lean(),
    Blog.countDocuments({ author: session.user.id, status: "rejected" })
  ]);

  return NextResponse.json({ blogs: blogs.map(serializeBlogListItem), rejectedCount, restricted: rejectedCount >= 3 });
}
