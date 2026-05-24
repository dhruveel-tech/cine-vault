"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BlogLikeButton({ blogId, initialLiked, initialCount }: { blogId: string; initialLiked: boolean; initialCount: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleLike() {
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/blogs/${blogId}/like`, { method: "POST" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Could not update like.");
        setLiked(payload.liked);
        setCount(payload.likesCount);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not update like.");
      }
    });
  }

  return (
    <div>
      <Button type="button" variant={liked ? "default" : "outline"} onClick={toggleLike} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", liked ? "fill-current" : "")} />}
        {liked ? "Liked" : "Like"} · {count}
      </Button>
      {message ? <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-300">{message}</p> : null}
    </div>
  );
}
