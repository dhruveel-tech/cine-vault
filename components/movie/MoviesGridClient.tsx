"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MoreVertical, Trash2, X } from "lucide-react";

import type { MovieCardDTO } from "@/types/movie.types";
import MovieCard from "@/components/movie/MovieCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MoviesGridClientProps = {
  movies: MovieCardDTO[];
  isAdmin: boolean;
};

type DeleteState = {
  movie: MovieCardDTO;
} | null;

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as { error?: string; data?: unknown };
  } catch {
    return { error: text };
  }
}

export default function MoviesGridClient({ movies, isAdmin }: MoviesGridClientProps) {
  const [items, setItems] = useState(movies);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const movieCountLabel = useMemo(() => {
    const count = items.length;
    return `${count} ${count === 1 ? "title" : "titles"}`;
  }, [items.length]);

  useEffect(() => {
    setItems(movies);
    setOpenMenuId(null);
    setDeleteState(null);
  }, [movies]);

  useEffect(() => {
    if (notice?.type !== "success") return;

    const timer = window.setTimeout(() => {
      setNotice((current) => (current?.type === "success" ? null : current));
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-movie-actions-menu]")) return;
      setOpenMenuId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  function openDeleteDialog(movie: MovieCardDTO) {
    setNotice(null);
    setOpenMenuId(null);
    setDeleteState({ movie });
  }

  function closeDeleteDialog() {
    if (isPending) return;
    setDeleteState(null);
  }

  function confirmDelete() {
    if (!deleteState?.movie || isPending) return;

    const movie = deleteState.movie;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/movies/${encodeURIComponent(movie.id)}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json"
          }
        });

        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(payload?.error || "Could not delete this movie. Please try again.");
        }

        setItems((current) => current.filter((item) => item.id !== movie.id));
        setDeleteState(null);
        setNotice({ type: "success", message: `${movie.title} was permanently removed from the database.` });
      } catch (error) {
        setNotice({
          type: "error",
          message: error instanceof Error ? error.message : "Could not delete this movie. Please try again."
        });
      }
    });
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Trash2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">No movies in this view</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
          Deleted titles disappear immediately from this page and are permanently removed from MongoDB.
        </p>
        {notice ? <StatusNotice notice={notice} className="mx-auto mt-6 max-w-xl" /> : null}
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {notice ? <StatusNotice notice={notice} /> : null}

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>{movieCountLabel} shown</span>
        {isAdmin ? <span className="font-medium text-blue-600 dark:text-blue-400">Admin mode</span> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((movie) => (
          <div key={movie.id} className="group/card relative">
            <MovieCard movie={movie} />
            {isAdmin ? (
              <MovieActionsMenu
                movie={movie}
                isOpen={openMenuId === movie.id}
                onToggle={() => setOpenMenuId((current) => (current === movie.id ? null : movie.id))}
                onDelete={() => openDeleteDialog(movie)}
              />
            ) : null}
          </div>
        ))}
      </div>

      <DeleteMovieDialog
        state={deleteState}
        isDeleting={isPending}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function MovieActionsMenu({
  movie,
  isOpen,
  onToggle,
  onDelete
}: {
  movie: MovieCardDTO;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-30" data-movie-actions-menu>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Open admin actions for ${movie.title}`}
        aria-expanded={isOpen}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/55 text-white shadow-lg shadow-slate-950/25 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:scale-95",
          "dark:border-white/15 dark:bg-slate-950/70",
          isOpen ? "bg-blue-600 text-white shadow-blue-950/30" : "opacity-90 group-hover/card:opacity-100"
        )}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-12 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/20 ring-1 ring-slate-950/5 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/50 dark:ring-white/10">
          <div className="px-3 py-2">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin actions</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{movie.title}</p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-[0.98] dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete movie
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StatusNotice({ notice, className }: { notice: NonNullable<Notice>; className?: string }) {
  const isSuccess = notice.type === "success";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition duration-300 animate-in fade-in slide-in-from-top-2",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100",
        className
      )}
    >
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{notice.message}</span>
    </div>
  );
}

function DeleteMovieDialog({
  state,
  isDeleting,
  onCancel,
  onConfirm
}: {
  state: DeleteState;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!state) return null;

  const { movie } = state;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="delete-movie-title">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close delete movie confirmation dialog"
      />

      <Card className="relative w-full max-w-lg overflow-hidden border-red-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-red-500/25 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-300">Permanent removal</p>
              <h2 id="delete-movie-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Delete this movie?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="leading-7 text-slate-600 dark:text-slate-300">
            You are about to remove <span className="font-bold text-slate-950 dark:text-white">{movie.title}</span> from the CineVault library. The movie record will be deleted from MongoDB and will no longer appear for users.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <MetaItem label="Title" value={movie.title} />
              <MetaItem label="Year" value={movie.releaseYear ? String(movie.releaseYear) : "TBA"} />
              <MetaItem label="Type" value={movie.type.replace("_", " ")} />
              <MetaItem label="Genres" value={movie.genres.slice(0, 3).join(", ") || "None"} />
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-100">
            This action cannot be undone. Any direct link to this movie detail page will no longer be available.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Deleting..." : "Delete movie"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 capitalize text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
