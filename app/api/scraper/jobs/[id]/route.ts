import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeScraperJob } from "@/lib/scraper-serializers";
import ScraperJob from "@/models/ScraperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;
  const job = await ScraperJob.findById(id).lean();

  if (!job) {
    return NextResponse.json({ error: "Scraper job not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeScraperJob(job) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;
  const deletedJob = await ScraperJob.findByIdAndDelete(id).lean();

  if (!deletedJob) {
    return NextResponse.json({ error: "Scraper job not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      deletedId: id,
      deletedJob: serializeScraperJob(deletedJob)
    }
  });
}
