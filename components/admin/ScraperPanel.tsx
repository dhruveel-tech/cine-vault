"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  RotateCcw,
  ExternalLink,
  FileJson,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScraperJobDTO } from "@/types/scraper.types";

const sourceOptions = [
  { value: "tmdb", label: "TMDB", description: "Core metadata" },
  { value: "streaming", label: "Streaming", description: "OTT availability" },
  { value: "imdb", label: "IMDb", description: "Supplemental" },
  { value: "omdb", label: "OMDb", description: "Ratings" }
];

type ApiPayload<T = unknown> = {
  data?: T;
  error?: string;
  details?: unknown;
};

type ConfirmAction =
  | { type: "retry"; job: ScraperJobDTO }
  | { type: "delete"; job: ScraperJobDTO }
  | { type: "import"; job: ScraperJobDTO }
  | null;

async function readJsonSafely<T>(response: Response): Promise<ApiPayload<T>> {
  const text = await response.text();

  if (!text) {
    return {
      error: response.ok ? undefined : `Request failed with status ${response.status}`
    };
  }

  try {
    return JSON.parse(text) as ApiPayload<T>;
  } catch {
    return {
      error: response.ok ? "The server returned an invalid JSON response." : `Request failed with status ${response.status}`,
      details: text.slice(0, 500)
    };
  }
}

function statusIcon(status: ScraperJobDTO["status"]) {
  if (status === "completed" || status === "imported") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock3 className="h-4 w-4 text-blue-500" />;
}

function statusClass(status?: ScraperJobDTO["status"]) {
  if (status === "imported") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (status === "completed") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";
}

function detailsToText(details: unknown) {
  if (!details) return "";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function trimErrorMessage(message: string) {
  return message.replace(/^Scraper agent error:\s*/i, "").trim();
}

function jobResultPreview(job: ScraperJobDTO | null) {
  if (!job?.result) return "";
  return JSON.stringify(job.result, null, 2);
}

export default function ScraperPanel() {
  const [query, setQuery] = useState("Dune Part Two");
  const [region, setRegion] = useState("US");
  const [sources, setSources] = useState<string[]>(["tmdb", "streaming"]);
  const [jobs, setJobs] = useState<ScraperJobDTO[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScraperJobDTO | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importedSlug, setImportedSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  async function loadJobs() {
    const response = await fetch("/api/scraper/jobs?limit=12", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await readJsonSafely<ScraperJobDTO[]>(response);
    setJobs(payload.data ?? []);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const selectedJson = useMemo(() => jobResultPreview(selectedJob), [selectedJob]);
  const canImport = Boolean(selectedJob?.result && selectedJob.status !== "failed" && selectedJob.status !== "imported");
  const failedJobsCount = jobs.filter((job) => job.status === "failed").length;

  function clearFeedback() {
    setMessage(null);
    setError(null);
    setErrorDetails(null);
    setImportedSlug(null);
  }

  function toggleSource(source: string) {
    setSources((current) => {
      if (current.includes(source)) return current.filter((item) => item !== source);
      return [...current, source];
    });
  }

  function selectJob(job: ScraperJobDTO) {
    clearFeedback();
    setSelectedJob(job);
  }

  function openRetryDialog(job: ScraperJobDTO) {
    setConfirmAction({ type: "retry", job });
  }

  function openDeleteDialog(job: ScraperJobDTO) {
    setConfirmAction({ type: "delete", job });
  }

  function openImportDialog(job: ScraperJobDTO) {
    setConfirmAction({ type: "import", job });
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    const currentAction = confirmAction;
    setConfirmAction(null);

    if (currentAction.type === "retry") {
      await retryJob(currentAction.job);
      return;
    }

    if (currentAction.type === "import") {
      await importJob(currentAction.job);
      return;
    }

    await deleteJob(currentAction.job);
  }

  function triggerScraper() {
    clearFeedback();
    startTransition(async () => {
      const response = await fetch("/api/scraper/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, region, sources })
      });
      const payload = await readJsonSafely<ScraperJobDTO>(response);

      if (!response.ok) {
        setError(trimErrorMessage(payload.error ?? "Scraper failed"));
        setErrorDetails(detailsToText(payload.details) || null);
        if (payload.data) setSelectedJob(payload.data);
        await loadJobs();
        return;
      }

      setSelectedJob(payload.data ?? null);
      setMessage("Scrape completed. Review the JSON preview before importing.");
      await loadJobs();
    });
  }

  function importSelectedJob() {
    if (!selectedJob) return;
    openImportDialog(selectedJob);
  }

  async function importJob(job: ScraperJobDTO) {
    clearFeedback();
    setSelectedJob(job);
    startImportTransition(async () => {
      const response = await fetch(`/api/scraper/jobs/${job.id}/import`, { method: "POST" });
      const payload = await readJsonSafely<{ job: ScraperJobDTO; movie?: { slug?: string }; alreadyExisted?: boolean }>(response);

      if (!response.ok) {
        setError(payload.error ?? "Import failed");
        setErrorDetails(detailsToText(payload.details) || null);
        await loadJobs();
        return;
      }

      if (payload.data?.job) setSelectedJob(payload.data.job);
      setImportedSlug(payload.data?.movie?.slug ?? null);
      setMessage(payload.data?.alreadyExisted ? "This movie already existed. The scraper job is linked to the existing movie." : "Movie imported into MongoDB successfully.");
      await loadJobs();
    });
  }

  async function retryJob(job: ScraperJobDTO) {
    clearFeedback();
    setRetryingJobId(job.id);
    setSelectedJob(job);

    try {
      const response = await fetch(`/api/scraper/jobs/${job.id}/retry`, { method: "POST" });
      const payload = await readJsonSafely<ScraperJobDTO>(response);

      if (!response.ok) {
        setError(trimErrorMessage(payload.error ?? "Retry failed"));
        setErrorDetails(detailsToText(payload.details) || null);
        if (payload.data) setSelectedJob(payload.data);
        await loadJobs();
        return;
      }

      if (payload.data) {
        setSelectedJob(payload.data);
      }
      setMessage("Retry completed. Review the refreshed JSON preview before importing.");
      await loadJobs();
    } finally {
      setRetryingJobId(null);
    }
  }

  async function deleteJob(job: ScraperJobDTO) {
    clearFeedback();
    setDeletingJobId(job.id);

    try {
      const response = await fetch(`/api/scraper/jobs/${job.id}`, { method: "DELETE" });
      const payload = await readJsonSafely<{ deletedId: string }>(response);

      if (!response.ok) {
        setError(payload.error ?? "Could not delete scraper job");
        setErrorDetails(detailsToText(payload.details) || null);
        return;
      }

      setJobs((current) => current.filter((item) => item.id !== job.id));
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }
      setMessage("Scraper job removed from Recent jobs and MongoDB.");
      await loadJobs();
    } finally {
      setDeletingJobId(null);
    }
  }

  async function copyJson() {
    if (!selectedJob?.result) return;
    await navigator.clipboard.writeText(selectedJson);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const confirmTitle = confirmAction?.type === "retry"
    ? "Retry scraper job?"
    : confirmAction?.type === "import"
      ? "Import movie into MongoDB?"
      : "Delete this scraper job?";
  const confirmDescription = confirmAction?.type === "retry"
    ? `This will run the scraper again for "${confirmAction.job.query}" using region ${confirmAction.job.region}.`
    : confirmAction?.type === "import"
      ? `This will import the reviewed JSON for "${confirmAction.job.query}" into the movies collection.`
      : `You are about to remove "${confirmAction?.job.query}" from Recent jobs. The job record, saved response, and error history will be deleted from MongoDB.`;

  return (
    <main className="min-h-[calc(100vh-76px)] overflow-x-hidden bg-slate-50/70 dark:bg-slate-950/40">
      <div className="shell-container max-w-[1500px] py-6 md:py-8">
        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              Admin scraper workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Scrape, review, import.</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
              Run the FastAPI scraper, review normalized JSON, retry failed jobs, and import approved data into MongoDB.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:min-w-72">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/70">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Selected</p>
              <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(selectedJob?.status)}`}>
                {selectedJob ? statusIcon(selectedJob.status) : <FileJson className="h-4 w-4" />}
                {selectedJob?.status ?? "None"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/70">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Jobs</p>
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{jobs.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{failedJobsCount} failed</p>
            </div>
          </div>
        </div>

        {(message || error) ? (
          <div className={`mb-4 shrink-0 rounded-3xl border p-4 shadow-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                {error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-bold">{error ?? message}</p>
                  {errorDetails ? <pre className="mt-3 max-h-28 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white/70 p-3 text-xs dark:bg-slate-950/50">{errorDetails}</pre> : null}
                </div>
              </div>
              {importedSlug ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/movies/${importedSlug}`}>
                    View movie
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)] xl:grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)] xl:items-start">
            <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Search className="h-5 w-5 text-blue-500" />
                  New scrape
                </CardTitle>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter a title and region. The JSON response appears below in the full-width preview.</p>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Movie or series title</label>
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Oppenheimer 2023" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Region</label>
                    <Input value={region} onChange={(event) => setRegion(event.target.value.toUpperCase())} placeholder="US" maxLength={8} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Sources</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sourceOptions.map((option) => {
                      const active = sources.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleSource(option.value)}
                          className={`rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                            active
                              ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
                          }`}
                        >
                          <span className="block text-sm font-black">{option.label}</span>
                          <span className={`mt-1 block text-xs ${active ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={triggerScraper} disabled={isPending || !query.trim() || sources.length === 0} className="w-full">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isPending ? "Scraping..." : "Run scraper"}
                </Button>
              </div>
            </section>

            <aside className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-slate-950 dark:text-white">Recent jobs</CardTitle>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Select, retry, or remove scraper jobs without leaving the workspace.</p>
                  </div>
                  <Badge variant="secondary">{jobs.length}</Badge>
                </div>
              </div>

              <div className="smooth-scroll-panel grid max-h-[360px] gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:max-h-[430px] lg:grid-cols-1 xl:grid-cols-2">
                {jobs.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950/70 dark:text-slate-400 sm:col-span-2 lg:col-span-1 xl:col-span-2">No scraper jobs yet.</p>
                ) : (
                  jobs.map((job) => {
                    const isRetrying = retryingJobId === job.id;
                    const isDeleting = deletingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectJob(job)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectJob(job);
                          }
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
                          selectedJob?.id === job.id
                            ? "border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                            : "border-slate-200 bg-slate-50 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="line-clamp-1 font-bold text-slate-900 dark:text-white">{job.query}</span>
                          <span className="flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {statusIcon(job.status)}
                            {job.status}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="secondary">{job.region}</Badge>
                          {job.sources.map((source) => <Badge key={source} variant="secondary">{source}</Badge>)}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.status === "failed" ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openRetryDialog(job);
                              }}
                              disabled={isRetrying || isPending}
                              className="h-9 px-3"
                            >
                              {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                              Retry
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteDialog(job);
                            }}
                            disabled={isDeleting}
                            className="h-9 px-3 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </div>

          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:flex-row md:items-center">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  JSON preview
                </CardTitle>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Full-width preview with internal scrolling for large payloads.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {selectedJob?.status === "failed" ? (
                  <Button onClick={() => openRetryDialog(selectedJob)} disabled={retryingJobId === selectedJob.id || isPending}>
                    {retryingJobId === selectedJob.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Retry fetch
                  </Button>
                ) : null}
                {selectedJob ? (
                  <Button
                    onClick={() => openDeleteDialog(selectedJob)}
                    variant="secondary"
                    disabled={deletingJobId === selectedJob.id}
                    className="text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                  >
                    {deletingJobId === selectedJob.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remove
                  </Button>
                ) : null}
                <Button onClick={copyJson} variant="secondary" disabled={!selectedJob?.result}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy JSON"}
                </Button>
                <Button onClick={importSelectedJob} disabled={!canImport || isImporting}>
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  {selectedJob?.status === "imported" ? "Imported" : "Import movie"}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden">
              {selectedJob?.error ? (
                <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {trimErrorMessage(selectedJob.error)}
                </div>
              ) : null}
              {selectedJob?.result ? (
                <div className="smooth-scroll-panel max-h-[70vh] max-w-full overflow-auto lg:max-h-[640px]">
                  <pre className="m-0 min-w-0 whitespace-pre-wrap break-words p-6 font-mono text-xs leading-6 text-slate-700 dark:text-slate-200">
                    {selectedJson}
                  </pre>
                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400 lg:min-h-[460px]">
                  <div className="max-w-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                      <FileJson className="h-7 w-7" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">No JSON selected yet</p>
                    <p className="mt-2 text-sm leading-6">Run a scrape or choose a recent completed job to preview structured movie data.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scraper-confirm-title">
          <div className="w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${confirmAction.type === "delete" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"}`}>
                  {confirmAction.type === "retry" ? <RotateCcw className="h-5 w-5" /> : confirmAction.type === "import" ? <Database className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  {confirmAction.type === "delete" ? (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-300">Permanent removal</p>
                  ) : null}
                  <h2 id="scraper-confirm-title" className="text-xl font-black text-slate-950 dark:text-white">{confirmTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{confirmDescription}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close confirmation dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-sm font-black text-slate-950 dark:text-white">{confirmAction.job.query}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{confirmAction.job.region}</Badge>
                  {confirmAction.job.sources.map((source) => <Badge key={source} variant="secondary">{source}</Badge>)}
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(confirmAction.job.status)}`}>
                    {statusIcon(confirmAction.job.status)}
                    {confirmAction.job.status}
                  </span>
                </div>
              </div>

              {confirmAction.type === "delete" ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  This action cannot be undone. The job will disappear from Recent jobs for all admin users.
                </p>
              ) : null}

              {confirmAction.type === "import" ? (
                <p className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  Confirm that the JSON preview has been reviewed. The import will create or link the movie record in MongoDB.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={runConfirmedAction}
                disabled={retryingJobId === confirmAction.job.id || deletingJobId === confirmAction.job.id || isImporting}
                className={confirmAction.type === "delete" ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500" : undefined}
              >
                {confirmAction.type === "retry" ? (
                  <RotateCcw className="h-4 w-4" />
                ) : confirmAction.type === "import" ? (
                  isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {confirmAction.type === "retry" ? "Retry job" : confirmAction.type === "import" ? "Import movie" : "Delete job"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
