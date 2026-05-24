import { ArrowRight, Database, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50/70 py-10 dark:bg-slate-950/40">
      <div className="shell-container max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" />
            Admin workspace
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Manage CineVault data.</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Keep imports controlled with a review-first workflow for scraper jobs and MongoDB movie entries.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                <Database className="h-5 w-5 text-blue-500" />
                Scraper import panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Search a movie title, let the FastAPI agent collect metadata, preview the normalized JSON, then import approved results into MongoDB.
              </p>
              <Button asChild>
                <Link href="/admin/scraper">
                  Open scraper
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Import workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li><strong className="text-slate-900 dark:text-white">1.</strong> Run scraper by title and region.</li>
                <li><strong className="text-slate-900 dark:text-white">2.</strong> Review the JSON preview inside the fixed preview panel.</li>
                <li><strong className="text-slate-900 dark:text-white">3.</strong> Import into MongoDB only after validation succeeds.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
