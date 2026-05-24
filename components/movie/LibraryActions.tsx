"use client";

import { useState, useTransition } from "react";
import { Bookmark, Heart, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LibraryActionsProps = {
  movieId: string;
  isAuthenticated: boolean;
  initialWatchlist: boolean;
  initialFavorite: boolean;
};

async function toggle(endpoint: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "Action failed");
  return Boolean(payload?.data?.active);
}

export default function LibraryActions({
  movieId,
  isAuthenticated,
  initialWatchlist,
  initialFavorite
}: LibraryActionsProps) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [favorite, setFavorite] = useState(initialFavorite);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Button asChild variant="secondary">
        <Link href="/login">Sign in to save</Link>
      </Button>
    );
  }

  function run(type: "watchlist" | "favorites") {
    setMessage(null);
    startTransition(async () => {
      try {
        const active = await toggle(`/api/user/${type}/${movieId}`);
        if (type === "watchlist") {
          setWatchlist(active);
          setMessage(active ? "Added to your watchlist." : "Removed from your watchlist.");
        } else {
          setFavorite(active);
          setMessage(active ? "Added to favorites." : "Removed from favorites.");
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not update your library.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant={watchlist ? "default" : "secondary"} onClick={() => run("watchlist")} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-4 w-4", watchlist && "fill-current")} />}
        {watchlist ? "In watchlist" : "Add to watchlist"}
      </Button>
      <Button type="button" variant={favorite ? "default" : "outline"} onClick={() => run("favorites")} disabled={isPending}>
        <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
        {favorite ? "Favorited" : "Favorite"}
      </Button>
      {message ? <span className="text-sm font-medium text-blue-600 dark:text-blue-300">{message}</span> : null}
    </div>
  );
}
