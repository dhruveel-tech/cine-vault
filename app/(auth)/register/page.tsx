import { redirect } from "next/navigation";

import { auth } from "@/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export const runtime = "nodejs";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/movies");

  return (
    <div className="shell-container grid min-h-[78vh] gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16">
      <section className="hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Join CineVault</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Build your personal gateway to cinema discovery.
        </h1>
        <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
          Create an account to keep your movie research organized and get ready for watchlists, favorites, reviews, and community features.
        </p>
      </section>

      <div className="mx-auto w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
