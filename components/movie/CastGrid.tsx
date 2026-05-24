import Image from "next/image";
import { Users } from "lucide-react";

import type { MovieDetailDTO } from "@/types/movie.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CastGrid({ cast }: { cast: MovieDetailDTO["cast"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast</CardTitle>
      </CardHeader>
      <CardContent>
        {cast.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cast.slice(0, 18).map((member) => (
              <div key={`${member.name}-${member.character ?? "role"}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-blue-50 dark:bg-blue-500/10">
                  {member.profileUrl ? (
                    <Image src={member.profileUrl} alt={member.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950 dark:text-white">{member.name}</p>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{member.character || "Cast member"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cast data is not available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
