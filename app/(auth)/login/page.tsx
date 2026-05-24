import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LoginForm from "@/components/auth/LoginForm";

export const runtime = "nodejs";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect("/movies");

  const params = await searchParams;
  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;

  return (
    <div className="shell-container grid min-h-[78vh] gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16">
      <section className="hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Welcome back</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Continue your movie research journey.
        </h1>
        <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
          Sign in to access a cleaner browsing experience, save your research flow, and prepare for personalized discovery features.
        </p>
      </section>

      <div className="mx-auto w-full max-w-md">
        <LoginForm callbackUrl={callbackUrl ?? "/movies"} />
      </div>
    </div>
  );
}
