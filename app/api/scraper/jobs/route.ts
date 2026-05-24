import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeScraperJob } from "@/lib/scraper-serializers";
import ScraperJob from "@/models/ScraperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 10), 1), 50);
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    ScraperJob.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ScraperJob.countDocuments({})
  ]);

  return NextResponse.json({
    data: jobs.map(serializeScraperJob),
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}
