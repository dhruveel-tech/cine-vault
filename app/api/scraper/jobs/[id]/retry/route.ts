import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { scrapeMovie } from "@/lib/scraper-client";
import { serializeScraperJob } from "@/lib/scraper-serializers";
import ScraperJob from "@/models/ScraperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;
  const job = await ScraperJob.findById(id);

  if (!job) {
    return NextResponse.json({ error: "Scraper job not found" }, { status: 404 });
  }

  if (job.status !== "failed") {
    return NextResponse.json(
      { error: "Only failed scraper jobs can be retried", data: serializeScraperJob(job.toObject()) },
      { status: 409 }
    );
  }

  job.status = "running";
  job.error = undefined;
  job.result = undefined;
  job.importedMovie = undefined;
  job.importedAt = undefined;
  job.startedAt = new Date();
  job.completedAt = undefined;
  await job.save();

  try {
    const result = await scrapeMovie({
      query: job.query,
      region: String(job.region || "US").toUpperCase(),
      sources: Array.isArray(job.sources) && job.sources.length > 0 ? job.sources : ["tmdb"]
    });

    job.status = "completed";
    job.result = result;
    job.error = undefined;
    job.completedAt = new Date();
    await job.save();

    return NextResponse.json({ data: serializeScraperJob(job.toObject()) });
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown scraper retry failure";
    job.completedAt = new Date();
    await job.save();

    return NextResponse.json({ error: job.error, data: serializeScraperJob(job.toObject()) }, { status: 502 });
  }
}
