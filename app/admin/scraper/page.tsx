import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ScraperPanel from "@/components/admin/ScraperPanel";

export default async function AdminScraperPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return <ScraperPanel />;
}
