import { NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import { escapeRegex, getMovieSort } from "@/lib/movie-queries";
import { serializeMovieCard } from "@/lib/serializers";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ genre: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { genre } = await context.params;
  const decodedGenre = decodeURIComponent(genre);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 24), 1), 60);

  await dbConnect();
  const movies = await Movie.find({ genres: { $regex: `^${escapeRegex(decodedGenre)}$`, $options: "i" } })
    .sort(getMovieSort(searchParams.get("sort")))
    .limit(limit)
    .lean();

  return NextResponse.json({ data: movies.map(serializeMovieCard) });
}
