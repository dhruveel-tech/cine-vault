import Link from "next/link";
import { PenLine, Search } from "lucide-react";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BLOG_CATEGORIES, serializeBlogListItem } from "@/lib/blog-utils";
import Blog from "@/models/Blog";
import BlogCard from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams?: Promise<{ category?: string; q?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = (await searchParams) || {};
  const category = params.category || "all";
  const q = params.q?.trim() || "";
  const session = await auth();

  await dbConnect();

  const filter: any = { status: "published" };
  if (category !== "all") filter.category = category;
  if (q) filter.$text = { $search: q };

  const [blogsRaw, editorsRaw] = await Promise.all([
    Blog.find(filter)
      .sort({ isEditorsPick: -1, publishedAt: -1, createdAt: -1 })
      .limit(24)
      .populate("author", "name email avatar image role")
      .populate("relatedMovie", "title slug releaseYear posterUrl")
      .lean(),
    Blog.find({ status: "published", isEditorsPick: true })
      .sort({ publishedAt: -1 })
      .limit(3)
      .populate("author", "name email avatar image role")
      .populate("relatedMovie", "title slug releaseYear posterUrl")
      .lean()
  ]);

  const blogs = blogsRaw.map(serializeBlogListItem);
  const editors = editorsRaw.map(serializeBlogListItem);

  return (
    <div className="shell-container py-10 md:py-14">
      <section className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">CineVault Journal</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 dark:text-white md:text-7xl">Movie writing from fans, critics, and researchers.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Read approved reviews, essays, news, top lists, and opinion pieces from the CineVault community.</p>
        </div>
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Community portal</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{blogs.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">published articles shown</p>
          <Button asChild className="mt-5 w-full">
            <Link href={session?.user ? "/blog/write" : "/login"}><PenLine className="h-4 w-4" /> {session?.user ? "Write article" : "Sign in to write"}</Link>
          </Button>
          {session?.user ? <Button asChild className="mt-3 w-full" variant="outline"><Link href="/blog/my">My articles</Link></Button> : null}
        </Card>
      </section>

      <form className="mt-10 grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/75 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search articles, tags, movies..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
        </div>
        <select name="category" defaultValue={category} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
          <option value="all">All categories</option>
          {BLOG_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <Button type="submit" className="h-12">Apply</Button>
      </form>

      {editors.length > 0 ? (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Editor's picks</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {editors.map((blog) => <BlogCard key={blog.id} blog={blog} compact />)}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Latest articles</h2>
          {(q || category !== "all") ? <Button asChild variant="outline"><Link href="/blog">Clear filters</Link></Button> : null}
        </div>
        {blogs.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        ) : (
          <Card className="border-dashed p-12 text-center text-slate-500 dark:text-slate-400">No articles match this view yet.</Card>
        )}
      </section>
    </div>
  );
}
