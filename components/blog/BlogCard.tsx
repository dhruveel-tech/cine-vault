import Link from "next/link";
import { CalendarDays, Eye, Heart, MessageCircle, PencilLine, Timer } from "lucide-react";

import type { BlogListItem } from "@/types/blog.types";
import { categoryLabel } from "@/lib/blog-utils";
import { cn } from "@/lib/utils";

export default function BlogCard({ blog, compact = false }: { blog: BlogListItem; compact?: boolean }) {
  const image = blog.coverImage || blog.relatedMovie?.posterUrl || "";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/10 dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-slate-950/40 dark:hover:border-blue-500/50">
      <Link href={`/blog/${blog.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <div className={cn("relative overflow-hidden bg-slate-100 dark:bg-slate-900", compact ? "h-40" : "h-52")}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-600/20 via-sky-500/10 to-slate-950/10 text-blue-600 dark:text-blue-300">
              <PencilLine className="h-10 w-10" />
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-xl">
            {categoryLabel(blog.category)}
          </div>
          {blog.isEditorsPick ? (
            <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-blue-950/30">
              Editor's Pick
            </div>
          ) : null}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {blog.readTime} min</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-xl font-black tracking-tight text-slate-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
            {blog.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{blog.excerpt}</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="truncate font-semibold text-slate-700 dark:text-slate-300">By {blog.author.name}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {blog.views}</span>
              <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {blog.likesCount}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {blog.commentsCount}</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
