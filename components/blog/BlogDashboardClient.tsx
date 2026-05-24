"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Loader2, MoreVertical, Pencil, Trash2, X, XCircle } from "lucide-react";

import type { BlogListItem } from "@/types/blog.types";
import { categoryLabel } from "@/lib/blog-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BlogDashboardClient({ initialBlogs, rejectedCount }: { initialBlogs: BlogListItem[]; rejectedCount: number }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BlogListItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => ({
    total: blogs.length,
    pending: blogs.filter((blog) => blog.status === "pending").length,
    published: blogs.filter((blog) => blog.status === "published").length,
    rejected: blogs.filter((blog) => blog.status === "rejected").length,
    drafts: blogs.filter((blog) => blog.status === "draft").length
  }), [blogs]);

  function deleteBlog(blog: BlogListItem) {
    const previous = blogs;
    setNotice(null);
    setBlogs((current) => current.filter((item) => item.id !== blog.id));
    setConfirmDelete(null);
    setOpenMenuId(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/blogs/${blog.id}`, { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Could not delete article.");
        setNotice(`"${blog.title}" was removed from your articles.`);
        window.setTimeout(() => setNotice(null), 2600);
      } catch (error) {
        setBlogs(previous);
        setNotice(error instanceof Error ? error.message : "Could not delete article.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="All" value={counts.total} />
        <Metric label="Drafts" value={counts.drafts} />
        <Metric label="Pending" value={counts.pending} />
        <Metric label="Approved" value={counts.published} />
        <Metric label="Rejected" value={counts.rejected} tone={rejectedCount >= 3 ? "danger" : "default"} />
      </div>

      {rejectedCount >= 3 ? (
        <Card className="border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Writing access restricted</p>
              <p className="mt-1 text-sm leading-6">Three of your articles were rejected. New article submissions are paused for this account until a moderator reviews your access.</p>
            </div>
          </div>
        </Card>
      ) : null}

      {notice ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">{notice}</div> : null}

      <div className="grid gap-4">
        {blogs.length > 0 ? blogs.map((blog) => (
          <Card key={blog.id} className="overflow-visible p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={blog.status} />
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{categoryLabel(blog.category)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{blog.status === "published" ? "Published" : "Not published"}</span>
                </div>
                <h2 className="mt-3 truncate text-xl font-black text-slate-950 dark:text-white">{blog.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{blog.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{blog.readTime} min read</span>
                  <span>{blog.likesCount} likes</span>
                  <span>{blog.commentsCount} comments</span>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <Button asChild variant="outline" size="sm"><Link href={`/blog/${blog.slug}`}><Eye className="h-4 w-4" /> View</Link></Button>
                <Button asChild size="sm"><Link href={`/blog/${blog.slug}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === blog.id ? null : blog.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-200"
                    aria-label={`Open actions for ${blog.title}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenuId === blog.id ? (
                    <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                      <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Article actions</p>
                      <button type="button" onClick={() => setConfirmDelete(blog)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" /> Delete article
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        )) : <Card className="border-dashed p-12 text-center text-slate-500 dark:text-slate-400">No articles yet. Start your first CineVault post.</Card>}
      </div>

      {confirmDelete ? (
        <ConfirmDeleteDialog
          blog={confirmDelete}
          loading={isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteBlog(confirmDelete)}
        />
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: BlogListItem["status"] }) {
  const config = {
    draft: { label: "Draft", icon: Pencil, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
    pending: { label: "Pending approval", icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200" },
    published: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200" },
    rejected: { label: "Rejected", icon: XCircle, className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200" }
  }[status];
  const Icon = config.icon;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]", config.className)}><Icon className="h-3.5 w-3.5" /> {config.label}</span>;
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <Card className={cn("p-5", tone === "danger" && "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn("mt-2 text-3xl font-black text-slate-950 dark:text-white", tone === "danger" && "text-red-700 dark:text-red-200")}>{value}</p>
    </Card>
  );
}

function ConfirmDeleteDialog({ blog, loading, onCancel, onConfirm }: { blog: BlogListItem; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200">
              <Trash2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Delete this article?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">You are about to remove "{blog.title}" from your CineVault articles. The article record, comments, and engagement data will be deleted.</p>
              <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-100">This action cannot be undone.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200" aria-label="Close dialog"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete article</Button>
        </div>
      </div>
    </div>
  );
}
