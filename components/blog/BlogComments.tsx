"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import type { BlogComment } from "@/types/blog.types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function BlogComments({ blogId, initialComments, canComment }: { blogId: string; initialComments: BlogComment[]; canComment: boolean }) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmed = text.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/blogs/${blogId}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Could not add comment.");
        setComments((current) => [payload.comment, ...current]);
        setText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add comment.");
      }
    });
  }

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Comments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Join the conversation with other movie fans.</p>
        </div>
      </div>

      {canComment ? (
        <Card className="mb-6 p-4">
          <form onSubmit={submitComment} className="space-y-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              <Button type="submit" disabled={isPending || !text.trim()}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post comment
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed p-5 text-sm text-slate-500 dark:text-slate-400">Sign in to comment on this article.</Card>
      )}

      <div className="space-y-4">
        {comments.length > 0 ? comments.map((comment) => (
          <Card key={comment.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                {comment.user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-950 dark:text-white">{comment.user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{comment.text}</p>
              </div>
            </div>
          </Card>
        )) : (
          <Card className="border-dashed p-8 text-center text-slate-500 dark:text-slate-400">No comments yet. Be the first to respond.</Card>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
