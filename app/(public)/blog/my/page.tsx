import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeBlogListItem } from "@/lib/blog-utils";
import Blog from "@/models/Blog";
import BlogDashboardClient from "@/components/blog/BlogDashboardClient";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MyBlogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const [blogsRaw, rejectedCount] = await Promise.all([
    Blog.find({ author: session.user.id })
      .sort({ updatedAt: -1 })
      .populate("author", "name email avatar image role")
      .populate("relatedMovie", "title slug releaseYear posterUrl")
      .lean(),
    Blog.countDocuments({ author: session.user.id, status: "rejected" })
  ]);
  const blogs = blogsRaw.map(serializeBlogListItem);

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Writer dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">My articles</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Track drafts, approval status, published visibility, and rejected articles from one place.</p>
        </div>
        {rejectedCount < 3 ? <Button asChild><Link href="/blog/write">Create article</Link></Button> : null}
      </div>
      <BlogDashboardClient initialBlogs={blogs} rejectedCount={rejectedCount} />
    </div>
  );
}
