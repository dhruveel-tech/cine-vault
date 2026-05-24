"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Tv } from "lucide-react";

import type { MovieDetailDTO } from "@/types/movie.types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  platforms: MovieDetailDTO["streamingPlatforms"];
};

export default function StreamingAvailability({ platforms }: Props) {
  const regions = useMemo(() => Array.from(new Set(platforms.map((item) => item.region).filter(Boolean))).sort(), [platforms]);
  const [region, setRegion] = useState(regions[0] ?? "ALL");
  const visible = region === "ALL" ? platforms : platforms.filter((item) => item.region === region);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Streaming availability</CardTitle>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">OTT platforms by region.</p>
        </div>
        {regions.length > 1 ? (
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">All regions</option>
            {regions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        ) : null}
      </CardHeader>
      <CardContent>
        {visible.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((platform) => (
              <a
                key={`${platform.name}-${platform.region}-${platform.type}-${platform.url ?? "none"}`}
                href={platform.url || undefined}
                target={platform.url ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                    <Tv className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-950 dark:text-white">{platform.name}</span>
                    <span className="mt-1 flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Badge variant="secondary">{platform.region}</Badge>
                      <Badge variant="secondary">{platform.type}</Badge>
                    </span>
                  </span>
                </span>
                {platform.url ? <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" /> : null}
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Streaming data is not available for this title yet. Run the scraper with streaming enabled to populate this section.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
