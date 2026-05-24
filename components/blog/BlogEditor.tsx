"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bold, Heading2, ImageIcon, Italic, Link2, List, Loader2, Save, Send, Sparkles, X } from "lucide-react";

import type { BlogCategory, BlogDetail } from "@/types/blog.types";
import { BLOG_CATEGORIES } from "@/lib/blog-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BlogEditorProps = {
  mode: "create" | "edit";
  initialBlog?: BlogDetail;
};

const EMPTY_CONTENT = "";
const DRAFT_KEY = "cinevault-blog-editor-draft";

export default function BlogEditor({ mode, initialBlog }: BlogEditorProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(initialBlog?.title || "");
  const [category, setCategory] = useState<BlogCategory>(initialBlog?.category || "review");
  const [tagsInput, setTagsInput] = useState((initialBlog?.tags || []).join(", "));
  const [excerpt, setExcerpt] = useState(initialBlog?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialBlog?.coverImage || "");
  const [relatedMovie, setRelatedMovie] = useState(initialBlog?.relatedMovie?.id || "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const tags = useMemo(() => tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8), [tagsInput]);

  useEffect(() => {
    if (!editorRef.current) return;

    if (mode === "create") {
      window.localStorage.removeItem(DRAFT_KEY);
      setTitle("");
      setCategory("review");
      setTagsInput("");
      setExcerpt("");
      setCoverImage("");
      setRelatedMovie("");
      editorRef.current.innerHTML = EMPTY_CONTENT;
      return;
    }

    editorRef.current.innerHTML = initialBlog?.content || EMPTY_CONTENT;
  }, [initialBlog?.content, mode]);

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function addImage() {
    const url = window.prompt("Paste an image URL");
    if (!url) return;
    runCommand("insertImage", url);
  }

  function addLink() {
    const url = window.prompt("Paste a URL");
    if (!url) return;
    runCommand("createLink", url);
  }

  function save(status: "draft" | "pending") {
    setMessage(null);
    const content = editorRef.current?.innerHTML || "";

    startTransition(async () => {
      try {
        const endpoint = mode === "edit" && initialBlog ? `/api/blogs/${initialBlog.id}` : "/api/blogs";
        const response = await fetch(endpoint, {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            excerpt,
            coverImage,
            category,
            tags,
            relatedMovie: relatedMovie || null,
            status
          })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Could not save article.");

        window.localStorage.removeItem(DRAFT_KEY);
        setMessage({
          type: "success",
          text: status === "draft"
            ? "Draft saved successfully."
            : "Article sent for approval. You can track its status from My Articles."
        });
        router.push(status === "draft" ? "/blog/my" : "/blog/my?submitted=true");
        router.refresh();
      } catch (error) {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save article." });
      } finally {
        setConfirmSubmitOpen(false);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save("draft");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6 min-w-0">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Article title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Write a strong movie article headline..."
                className="mt-3 w-full border-0 bg-transparent text-3xl font-black tracking-tight text-slate-950 outline-none placeholder:text-slate-400 dark:text-white md:text-5xl"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <ToolbarButton label="Bold" onClick={() => runCommand("bold")} icon={<Bold className="h-4 w-4" />} />
              <ToolbarButton label="Italic" onClick={() => runCommand("italic")} icon={<Italic className="h-4 w-4" />} />
              <ToolbarButton label="Heading" onClick={() => runCommand("formatBlock", "h2")} icon={<Heading2 className="h-4 w-4" />} />
              <ToolbarButton label="List" onClick={() => runCommand("insertUnorderedList")} icon={<List className="h-4 w-4" />} />
              <ToolbarButton label="Link" onClick={addLink} icon={<Link2 className="h-4 w-4" />} />
              <ToolbarButton label="Image" onClick={addImage} icon={<ImageIcon className="h-4 w-4" />} />
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[480px] p-6 text-base leading-8 text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] dark:text-slate-100 [&_a]:text-blue-600 [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-black [&_img]:my-5 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_li]:ml-5 [&_ul]:list-disc dark:[&_img]:border-slate-800"
              data-placeholder="Start writing your review, analysis, news article, or top list..."
            />
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
              <Sparkles className="h-5 w-5" />
              <h2 className="font-black text-slate-950 dark:text-white">Article settings</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Submitted articles go to moderation before publishing.</p>
            <div className="mt-5 space-y-4">
              <Field label="Category">
                <select value={category} onChange={(event) => setCategory(event.target.value as BlogCategory)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                  {BLOG_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
              <Field label="Tags">
                <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="dune, review, sci-fi" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </Field>
              <Field label="Excerpt">
                <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Optional short summary" className="min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </Field>
              <Field label="Cover image URL">
                <input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </Field>
              <Field label="Related movie ID">
                <input value={relatedMovie} onChange={(event) => setRelatedMovie(event.target.value)} placeholder="Optional MongoDB movie id" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
              </Field>
            </div>
          </Card>

          {message ? (
            <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100" : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100")}>{message.text}</div>
          ) : null}

          <div className="grid gap-3">
            <Button type="button" disabled={isPending} onClick={() => setConfirmSubmitOpen(true)} size="lg">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send for approval
            </Button>
            <Button type="submit" variant="outline" disabled={isPending} size="lg">
              <Save className="h-4 w-4" /> Save draft
            </Button>
          </div>
        </aside>
      </form>

      {confirmSubmitOpen ? (
        <ConfirmDialog
          title="Send article for approval?"
          description="Your article will be submitted to the CineVault moderation queue. An admin or moderator will review it before it becomes visible to readers."
          confirmLabel="Send for approval"
          loading={isPending}
          onCancel={() => setConfirmSubmitOpen(false)}
          onConfirm={() => save("pending")}
        />
      ) : null}
    </>
  );
}

function ConfirmDialog({ title, description, confirmLabel, loading, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200" aria-label="Close dialog"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10">
      {icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
