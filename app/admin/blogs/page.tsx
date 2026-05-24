import { redirect } from "next/navigation";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeBlogListItem } from "@/lib/blog-utils";
import Blog from "@/models/Blog";
import BlogModerationClient from "@/components/admin/BlogModerationClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!["admin", "moderator"].includes(session.user.role || "")) redirect("/profile");

  await dbConnect();
  const blogsRaw = await Blog.find({})
    .sort({ status: 1, updatedAt: -1, createdAt: -1 })
    .limit(80)
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .lean();
  const blogs = blogsRaw.map(serializeBlogListItem);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Moderation</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Blog management</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Review pending articles, approve publishing, reject submissions, feature Editor's Picks, and remove articles when needed.</p>
      </div>
      <BlogModerationClient initialBlogs={blogs} />
    </div>
  );
}
