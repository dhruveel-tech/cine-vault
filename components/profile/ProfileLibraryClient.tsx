"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, BookmarkMinus, EllipsisVertical, Loader2, Mail, Shield, Trash2, UserRound, X } from "lucide-react";

import MovieCard from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MovieCardDTO } from "@/types/movie.types";

type ProfileLibraryClientProps = {
  user: {
    name: string;
    email: string;
    role: string;
  };
  initialWatchlist: MovieCardDTO[];
  initialFavorites: MovieCardDTO[];
};

type ConfirmAction =
  | { type: "single"; movie: MovieCardDTO }
  | { type: "all"; count: number }
  | null;

async function removeFromWatchlist(movieId: string) {
  const response = await fetch(`/api/user/watchlist/${movieId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "Could not remove this movie from your watchlist.");
  }

  return payload;
}

async function clearWatchlist() {
  const response = await fetch("/api/user/watchlist", {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "Could not clear your watchlist.");
  }

  return payload;
}

export default function ProfileLibraryClient({ user, initialWatchlist, initialFavorites }: ProfileLibraryClientProps) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [message, setMessage] = useState<string | null>(null);
  const [menuMovieId, setMenuMovieId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    function closeMenu() {
      setMenuMovieId(null);
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  function requestRemoveMovie(movie: MovieCardDTO) {
    setMenuMovieId(null);
    setConfirmAction({ type: "single", movie });
  }

  function requestClearWatchlist() {
    if (watchlist.length === 0) return;
    setConfirmAction({ type: "all", count: watchlist.length });
  }

  function confirmRemoveMovie(movie: MovieCardDTO) {
    const previous = watchlist;
    setMessage(null);
    setRemovingId(movie.id);
    setConfirmAction(null);
    setWatchlist((current) => current.filter((item) => item.id !== movie.id));

    startTransition(async () => {
      try {
        await removeFromWatchlist(movie.id);
        setMessage(`${movie.title} was removed from your watchlist.`);
      } catch (error) {
        setWatchlist(previous);
        setMessage(error instanceof Error ? error.message : "Could not update your watchlist.");
      } finally {
        setRemovingId(null);
      }
    });
  }

  function confirmClearWatchlist() {
    const previous = watchlist;
    const removedCount = previous.length;
    setMessage(null);
    setIsClearingAll(true);
    setConfirmAction(null);
    setWatchlist([]);

    startTransition(async () => {
      try {
        await clearWatchlist();
        setMessage(removedCount === 1 ? "Your watchlist was cleared." : `${removedCount} movies were removed from your watchlist.`);
      } catch (error) {
        setWatchlist(previous);
        setMessage(error instanceof Error ? error.message : "Could not clear your watchlist.");
      } finally {
        setIsClearingAll(false);
      }
    });
  }

  const isBusy = isPending || isClearingAll;

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">My CineVault</p>
          <h1 className="mt-3 flex items-center gap-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <UserRound className="h-6 w-6" />
            </span>
            {user.name}
          </h1>
          {user.email ? (
            <p className="mt-4 inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          ) : null}
        </div>
        <Card className="px-5 py-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            <Shield className="h-4 w-4" />
            Role
          </p>
          <p className="mt-1 text-2xl font-black capitalize text-slate-950 dark:text-white">{user.role}</p>
        </Card>
      </div>

      {message ? (
        <div className="mb-6 rounded-3xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-sm font-semibold text-blue-700 dark:text-blue-200">
          {message}
        </div>
      ) : null}

      <LibrarySection
        title="Watchlist"
        subtitle="Movies you saved to watch later. Use the actions menu to keep your watchlist organized."
        movies={watchlist}
        empty="Add movies to your watchlist from any movie detail page."
        headerAction={
          watchlist.length > 0 ? (
            <Button type="button" variant="secondary" onClick={requestClearWatchlist} disabled={isBusy}>
              {isClearingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkMinus className="h-4 w-4" />}
              Remove all
            </Button>
          ) : null
        }
        renderOverlayAction={(movie) => (
          <div className="absolute left-3 top-3 z-20" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenuMovieId((current) => (current === movie.id ? null : movie.id));
              }}
              aria-label={`Open watchlist actions for ${movie.title}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-white shadow-lg shadow-slate-950/25 backdrop-blur transition hover:-translate-y-0.5 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/60 active:scale-95"
            >
              <EllipsisVertical className="h-5 w-5" />
            </button>

            {menuMovieId === movie.id ? (
              <div className="absolute left-0 top-12 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Watchlist actions</p>
                <button
                  type="button"
                  onClick={() => requestRemoveMovie(movie)}
                  disabled={isBusy && removingId === movie.id}
                  className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"
                >
                  {isBusy && removingId === movie.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkMinus className="h-4 w-4" />}
                  Remove from Watchlist
                </button>
              </div>
            ) : null}
          </div>
        )}
      />

      <div className="h-10" />

      <LibrarySection title="Favorites" subtitle="Your favorite movies and series." movies={initialFavorites} empty="Favorite movies to build a personal shortlist." />

      <WatchlistConfirmDialog
        action={confirmAction}
        isBusy={isBusy}
        onCancel={() => setConfirmAction(null)}
        onConfirmSingle={confirmRemoveMovie}
        onConfirmAll={confirmClearWatchlist}
      />
    </div>
  );
}

function LibrarySection({
  title,
  subtitle,
  movies,
  empty,
  headerAction,
  renderOverlayAction
}: {
  title: string;
  subtitle: string;
  movies: MovieCardDTO[];
  empty: string;
  headerAction?: ReactNode;
  renderOverlayAction?: (movie: MovieCardDTO) => ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {headerAction}
          <Button asChild variant="outline">
            <Link href="/movies">Browse movies</Link>
          </Button>
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((movie) => (
            <div key={movie.id} className="relative">
              {renderOverlayAction ? renderOverlayAction(movie) : null}
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed p-8 text-center text-slate-500 dark:text-slate-400">{empty}</Card>
      )}
    </section>
  );
}

function WatchlistConfirmDialog({
  action,
  isBusy,
  onCancel,
  onConfirmSingle,
  onConfirmAll
}: {
  action: ConfirmAction;
  isBusy: boolean;
  onCancel: () => void;
  onConfirmSingle: (movie: MovieCardDTO) => void;
  onConfirmAll: () => void;
}) {
  if (!action) return null;

  const isAll = action.type === "all";
  const title = isAll ? "Clear Watchlist?" : "Remove from Watchlist?";
  const itemTitle = isAll ? `${action.count} saved ${action.count === 1 ? "movie" : "movies"}` : action.movie.title;
  const description = isAll
    ? "You are about to clear your entire Watchlist. These movies will be removed from your saved list, but the movie records will remain available in CineVault."
    : `You are about to remove ${action.movie.title} from your Watchlist. The movie will stay in CineVault, but it will no longer appear in your saved list.`;
  const warning = isAll
    ? "This only changes your personal Watchlist and cannot be undone in bulk. You can add movies again later from their detail pages."
    : "This only changes your personal Watchlist. You can add this movie again later from its detail page.";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="watchlist-confirm-title">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Watchlist action</p>
            <h3 id="watchlist-confirm-title" className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Close confirmation dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Selected item</p>
            <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{itemTitle}</p>
          </div>

          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

          <div className="flex gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
            <p>{warning}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (action.type === "single") onConfirmSingle(action.movie);
              else onConfirmAll();
            }}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isAll ? "Clear Watchlist" : "Remove from Watchlist"}
          </Button>
        </div>
      </div>
    </div>
  );
}
