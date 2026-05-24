import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="shell-container flex min-h-[70vh] items-center justify-center py-12 text-center">
      <Card className="max-w-2xl p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Compass className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500 dark:text-slate-400">
          This page is not available. Head back home or continue browsing the movie library.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/movies">Browse movies</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
