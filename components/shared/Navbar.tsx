import Link from "next/link";
import { Film } from "lucide-react";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { ProfileMenu } from "@/components/shared/ProfileMenu";

async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 font-black tracking-tight text-slate-950 dark:text-white"
          aria-label="CineVault home"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-blue-600/35">
            <Film className="h-5 w-5" />
          </span>
          <span className="text-xl sm:text-2xl">
            Cine<span className="text-blue-500">Vault</span>
          </span>
        </Link>

        <nav className="hidden items-center rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 md:flex">
          <Link
            href="/"
            className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
          >
            Home
          </Link>
          <Link
            href="/movies"
            className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
          >
            Movies
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <ProfileMenu name={user.name} role={(user as { role?: string | null }).role} />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" className="hidden sm:inline-flex">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Join</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { Navbar };
export default Navbar;
