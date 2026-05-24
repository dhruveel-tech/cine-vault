"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Loader2, Star, Trash2, X, XCircle } from "lucide-react";

import type { BlogListItem } from "@/types/blog.types";
import { categoryLabel } from "@/lib/blog-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BlogModerationClient({ initialBlogs }: { initialBlogs: BlogListItem[] }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<BlogListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => ({
    pending: blogs.filter((blog) => blog.status === "pending").length,
    drafts: blogs.filter((blog) => blog.status === "draft").length,
    rejected: blogs.filter((blog) => blog.status === "rejected").length,
    published: blogs.filter((blog) => blog.status === "published").length
  }), [blogs]);

  function moderate(blog: BlogListItem, status: "published" | "rejected", isEditorsPick = blog.isEditorsPick) {
    setNotice("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blogs/${blog.id}/moderate`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, isEditorsPick })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Could not update article.");
        setBlogs((current) => current.map((item) => item.id === blog.id ? { ...item, status: payload.status, isEditorsPick: payload.isEditorsPick } : item));
        setNotice(`${blog.title} updated.`);
        window.setTimeout(() => setNotice(""), 2600);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not update article.");
      }
    });
  }

  function togglePick(blog: BlogListItem) {
    setNotice("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blogs/${blog.id}/moderate`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: blog.status, isEditorsPick: !blog.isEditorsPick })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Could not update article.");
        setBlogs((current) => current.map((item) => item.id === blog.id ? { ...item, isEditorsPick: payload.isEditorsPick } : item));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not update article.");
      }
    });
  }

  function deleteBlog(blog: BlogListItem) {
    const previous = blogs;
    setConfirmDelete(null);
    setBlogs((current) => current.filter((item) => item.id !== blog.id));
    startTransition(async () => {
      try {
        const response = await fetch(`/api/blogs/${blog.id}`, { method: "DELETE" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Could not delete article.");
        setNotice(`"${blog.title}" was deleted.`);
        window.setTimeout(() => setNotice(""), 2600);
      } catch (error) {
        setBlogs(previous);
        setNotice(error instanceof Error ? error.message : "Could not delete article.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Pending" value={counts.pending} />
        <Metric label="Drafts" value={counts.drafts} />
        <Metric label="Published" value={counts.published} />
        <Metric label="Rejected" value={counts.rejected} />
      </div>

      {notice ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">{notice}</div> : null}

      <div className="grid gap-4">
        {blogs.length > 0 ? blogs.map((blog) => {
          const showDecisionActions = blog.status === "pending";
          return (
            <Card key={blog.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={blog.status} />
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{categoryLabel(blog.category)}</span>
                    {blog.isEditorsPick ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Editor's Pick</span> : null}
                  </div>
                  <h2 className="mt-3 truncate text-xl font-black text-slate-950 dark:text-white">{blog.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{blog.excerpt}</p>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">By {blog.author.name} · {blog.readTime} min read · {blog.commentsCount} comments</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button asChild variant="outline"><Link href={`/blog/${blog.slug}`}><Eye className="h-4 w-4" /> View</Link></Button>
                  <Button type="button" variant="outline" disabled={isPending || blog.status !== "published"} onClick={() => togglePick(blog)} title={blog.status !== "published" ? "Only published articles can be Editor's Pick" : undefined}><Star className="h-4 w-4" /> {blog.isEditorsPick ? "Unpick" : "Pick"}</Button>
                  {showDecisionActions ? (
                    <>
                      <Button type="button" disabled={isPending} onClick={() => moderate(blog, "published", blog.isEditorsPick)}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve</Button>
                      <Button type="button" variant="destructive" disabled={isPending} onClick={() => moderate(blog, "rejected", false)}><XCircle className="h-4 w-4" /> Reject</Button>
                    </>
                  ) : null}
                  <Button type="button" variant="destructive" disabled={isPending} onClick={() => setConfirmDelete(blog)}><Trash2 className="h-4 w-4" /> Delete</Button>
                </div>
              </div>
            </Card>
          );
        }) : <Card className="border-dashed p-12 text-center text-slate-500 dark:text-slate-400">No articles are waiting for moderation.</Card>}
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
    draft: { label: "Draft", icon: Clock3, className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
    pending: { label: "Pending", icon: Clock3, className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200" },
    published: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200" },
    rejected: { label: "Rejected", icon: XCircle, className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200" }
  }[status];
  const Icon = config.icon;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]", config.className)}><Icon className="h-3.5 w-3.5" /> {config.label}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
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
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">Delete this article?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">You are about to remove "{blog.title}" from CineVault. The article record, comments, likes, and moderation history will be deleted.</p>
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
