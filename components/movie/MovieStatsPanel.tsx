import { Award, Banknote, Building2, Globe2, Languages, Star } from "lucide-react";

import type { MovieDetailDTO } from "@/types/movie.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function money(value?: number) {
  if (!value) return "TBA";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function score(value?: number) {
  return typeof value === "number" ? value.toFixed(1) : "TBA";
}

export default function MovieStatsPanel({ movie }: { movie: MovieDetailDTO }) {
  const rows = [
    { icon: Star, label: "TMDB", value: score(movie.ratings?.tmdb?.score) },
    { icon: Star, label: "IMDb", value: score(movie.ratings?.imdb?.score) },
    { icon: Award, label: "Rotten Tomatoes", value: movie.ratings?.rottenTomatoes?.tomatometer ? `${movie.ratings.rottenTomatoes.tomatometer}%` : "TBA" },
    { icon: Banknote, label: "Budget", value: money(movie.budget) },
    { icon: Globe2, label: "Worldwide box office", value: money(movie.boxOffice?.worldwide) },
    { icon: Languages, label: "Languages", value: movie.languages.join(", ") || "TBA" },
    { icon: Building2, label: "Production", value: movie.productionCompanies.slice(0, 3).join(", ") || "TBA" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <row.icon className="h-4 w-4 text-blue-500" />
              {row.label}
            </span>
            <span className="max-w-[55%] text-right text-sm font-semibold text-slate-950 dark:text-white">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
