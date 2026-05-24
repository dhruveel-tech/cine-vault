import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="shell-container flex flex-col gap-4 py-8 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">CineVault</p>
          <p className="mt-1">Movie research, streaming discovery, and community-ready cinema data.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="transition hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
          <Link href="/movies" className="transition hover:text-blue-600 dark:hover:text-blue-400">Movies</Link>
          <Link href="/blog" className="transition hover:text-blue-600 dark:hover:text-blue-400">Blog</Link>
        </div>
      </div>
    </footer>
  );
}
