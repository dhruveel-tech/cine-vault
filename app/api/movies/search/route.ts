import { NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import { buildMovieFilter, getMovieSort } from "@/lib/movie-queries";
import { serializeMovieCard } from "@/lib/serializers";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 24), 1), 60);
  const skip = (page - 1) * limit;

  const filter = buildMovieFilter({
    q: searchParams.get("q"),
    genre: searchParams.get("genre"),
    type: searchParams.get("type"),
    language: searchParams.get("language"),
    platform: searchParams.get("platform"),
    yearFrom: searchParams.get("yearFrom"),
    yearTo: searchParams.get("yearTo"),
    rating: searchParams.get("rating"),
    status: searchParams.get("status")
  });

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(getMovieSort(searchParams.get("sort"))).skip(skip).limit(limit).lean(),
    Movie.countDocuments(filter)
  ]);

  return NextResponse.json({
    data: movies.map(serializeMovieCard),
    meta: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}
