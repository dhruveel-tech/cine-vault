import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { scrapeMovie } from "@/lib/scraper-client";
import { serializeScraperJob } from "@/lib/scraper-serializers";
import { scraperTriggerSchema } from "@/lib/validations/scraper";
import ScraperJob from "@/models/ScraperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = scraperTriggerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scraper payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  const job = await ScraperJob.create({
    query: parsed.data.query,
    region: parsed.data.region.toUpperCase(),
    sources: parsed.data.sources,
    status: "running",
    requestedBy: session.user.id || undefined,
    startedAt: new Date()
  });

  try {
    const result = await scrapeMovie({
      query: parsed.data.query,
      region: parsed.data.region.toUpperCase(),
      sources: parsed.data.sources
    });

    job.status = "completed";
    job.result = result;
    job.completedAt = new Date();
    await job.save();

    return NextResponse.json({ data: serializeScraperJob(job.toObject()) }, { status: 201 });
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown scraper failure";
    job.completedAt = new Date();
    await job.save();

    return NextResponse.json({ error: job.error, data: serializeScraperJob(job.toObject()) }, { status: 502 });
  }
}
