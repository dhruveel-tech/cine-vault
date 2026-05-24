"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  FilePenLine,
  FolderOpen,
  Newspaper,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  name?: string | null;
  role?: string | null;
};

const baseItemClass =
  "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200";

export function ProfileMenu({ name, role }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isAdmin = role === "admin" || role === "moderator";
  const displayName = name || "Profile";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-950/5 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:translate-y-0 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-200",
          open && "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200",
        )}
      >
        <User className="h-4 w-4" />
        <span className="max-w-[9rem] truncate">{displayName}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-72 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/15 ring-1 ring-slate-950/5 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/40 dark:ring-white/10"
        >
          <div className="px-3 pb-2 pt-3">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              Account
            </p>
          </div>

          <Link href="/profile" role="menuitem" className={baseItemClass}>
            <User className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
            Profile
          </Link>

          <div className="my-2 h-px bg-slate-200 dark:bg-white/10" />

          <div className="px-3 pb-2 pt-1">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
              Blogs
            </p>
          </div>

          <Link href="/blog" role="menuitem" className={baseItemClass}>
            <Newspaper className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
            Browse blogs
          </Link>

          <Link href="/blog/write" role="menuitem" className={baseItemClass}>
            <FilePenLine className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
            Write article
          </Link>

          <Link href="/blog/my" role="menuitem" className={baseItemClass}>
            <FolderOpen className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
            My articles
          </Link>

          {isAdmin ? (
            <>
              <div className="my-2 h-px bg-slate-200 dark:bg-white/10" />
              <div className="px-3 pb-2 pt-1">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                  Admin tools
                </p>
              </div>

              <Link href="/admin/blogs" role="menuitem" className={baseItemClass}>
                <ShieldCheck className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                Blog moderation
              </Link>

              <Link href="/admin/scraper" role="menuitem" className={baseItemClass}>
                <Sparkles className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500" />
                Agent workspace
              </Link>
            </>
          ) : null}

          <div className="mt-2 rounded-2xl bg-blue-50 px-3 py-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
            <BookOpenText className="mr-2 inline h-3.5 w-3.5" />
            Admins can browse and write articles here, then manage approvals from moderation.
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
