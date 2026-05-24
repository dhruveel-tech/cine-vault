import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, PenLine } from "lucide-react";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogEditor from "@/components/blog/BlogEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function WriteBlogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const rejectedCount = await Blog.countDocuments({ author: session.user.id, status: "rejected" });
  const isRestricted = !["admin", "moderator"].includes(session.user.role || "") && rejectedCount >= 3;

  if (isRestricted) {
    return (
      <div className="shell-container py-16">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">Article submissions are restricted</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Three of your submitted articles were rejected, so new blog submissions are currently disabled for this account. Please review previous feedback or contact a moderator before writing again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/blog/my">View my articles</Link></Button>
            <Button asChild variant="outline"><Link href="/blog">Back to blog</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="shell-container py-10 md:py-14">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">Write for CineVault</p>
          <h1 className="mt-3 flex items-center gap-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl"><PenLine className="h-9 w-9 text-blue-600 dark:text-blue-300" /> Create article</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Create a clean draft or send your article for approval. Published visibility is granted only after moderation.</p>
        </div>
        <Button asChild variant="outline"><Link href="/blog/my">My articles</Link></Button>
      </div>
      <BlogEditor mode="create" />
    </div>
  );
}
