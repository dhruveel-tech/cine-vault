import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import dbConnect from "@/lib/mongodb";
import { serializeMovieCard } from "@/lib/serializers";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 12), 1), 30);
  const now = new Date();

  const data = await cached(
    `movies:upcoming:${limit}`,
    async () => {
      await dbConnect();
      const movies = await Movie.find({
        $or: [{ status: "upcoming" }, { releaseDate: { $gte: now } }]
      })
        .sort({ releaseDate: 1, releaseYear: 1, createdAt: -1 })
        .limit(limit)
        .lean();

      return movies.map(serializeMovieCard);
    },
    { ttlSeconds: 3600 }
  );

  return NextResponse.json({ data });
}
