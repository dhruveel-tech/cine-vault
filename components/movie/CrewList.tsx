import type { MovieDetailDTO } from "@/types/movie.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const priorityJobs = ["Director", "Writer", "Screenplay", "Producer", "Executive Producer", "Original Music Composer", "Cinematography"];

export default function CrewList({ crew }: { crew: MovieDetailDTO["crew"] }) {
  const grouped = priorityJobs
    .map((job) => ({
      job,
      people: crew.filter((member) => member.job.toLowerCase().includes(job.toLowerCase()))
    }))
    .filter((item) => item.people.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crew</CardTitle>
      </CardHeader>
      <CardContent>
        {grouped.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {grouped.map((group) => (
              <div key={group.job} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">{group.job}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {group.people.map((person) => person.name).join(", ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Crew data is not available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
