import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import dbConnect from "@/lib/mongodb";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function selector(id: string) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.trim().toUpperCase();

  await dbConnect();
  const movie = await Movie.findOne(selector(id)).select("streamingPlatforms ottPlatforms title").lean();
  if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });

  const platforms = (movie.streamingPlatforms ?? []).filter((item: any) => !region || item.region === region);

  return NextResponse.json({
    data: {
      title: movie.title,
      region: region ?? "ALL",
      streamingPlatforms: platforms,
      ottPlatforms: movie.ottPlatforms ?? []
    }
  });
}
