import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Edit3, Eye, MessageCircle, Timer } from "lucide-react";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { categoryLabel, serializeBlogDetail } from "@/lib/blog-utils";
import Blog from "@/models/Blog";
import BlogComments from "@/components/blog/BlogComments";
import BlogLikeButton from "@/components/blog/BlogLikeButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogDetailPageProps = { params: Promise<{ slug: string }> };

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const session = await auth();
  const { slug } = await params;
  await dbConnect();

  const raw: any = await Blog.findOne({ slug })
    .populate("author", "name email avatar image role")
    .populate("relatedMovie", "title slug releaseYear posterUrl")
    .populate("comments.user", "name avatar image role")
    .lean();

  if (!raw) notFound();

  const viewerRole = session?.user?.role;
  const viewerId = session?.user?.id;
  const canViewUnpublished = viewerId && (String(raw.author?._id) === viewerId || viewerRole === "admin" || viewerRole === "moderator");
  if (raw.status !== "published" && !canViewUnpublished) notFound();

  if (raw.status === "published") {
    await Blog.updateOne({ _id: raw._id }, { $inc: { views: 1 } });
    raw.views = Number(raw.views || 0) + 1;
  }

  raw.__viewerRole = viewerRole;
  const blog = serializeBlogDetail(raw, viewerId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage ? [blog.coverImage] : undefined,
    author: { "@type": "Person", name: blog.author.name },
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="shell-container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/blog" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Blog</Link>
            <span>/</span>
            <span>{categoryLabel(blog.category)}</span>
            {blog.status !== "published" ? <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">{blog.status}</span> : null}
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-6xl">{blog.title}</h1>
          <p className="mt-5 text-xl leading-9 text-slate-600 dark:text-slate-300">{blog.excerpt}</p>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">{blog.author.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <p className="font-bold text-slate-950 dark:text-white">{blog.author.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{blog.author.role || "writer"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
              <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4" /> {blog.readTime} min</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {blog.views}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {blog.commentsCount}</span>
            </div>
          </div>

          {blog.coverImage ? (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:shadow-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blog.coverImage} alt="" className="max-h-[520px] w-full object-cover" />
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <BlogLikeButton blogId={blog.id} initialLiked={blog.likedByViewer} initialCount={blog.likesCount} />
            <div className="flex flex-wrap items-center gap-2">
              {blog.relatedMovie ? <Button asChild variant="outline"><Link href={`/movies/${blog.relatedMovie.slug}`}>Related movie</Link></Button> : null}
              {blog.canEdit ? <Button asChild variant="outline"><Link href={`/blog/${blog.slug}/edit`}><Edit3 className="h-4 w-4" /> Edit</Link></Button> : null}
            </div>
          </div>

          <Card className="mt-8 p-6 md:p-9">
            <div className="text-slate-800 dark:text-slate-100 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-black [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-black [&_img]:my-6 [&_img]:rounded-3xl [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-5 [&_p]:leading-8 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: blog.content }} />
          </Card>

          <BlogComments blogId={blog.id} initialComments={blog.comments.slice().reverse()} canComment={Boolean(session?.user?.id)} />
        </div>
      </article>
    </main>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}
