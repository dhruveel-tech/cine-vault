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
  const region = searchParams.get("region")?.toUpperCase() || "GLOBAL";

  const data = await cached(
    `movies:trending:${region}:${limit}`,
    async () => {
      await dbConnect();
      const query = region === "GLOBAL" ? {} : { $or: [{ countries: region }, { "streamingPlatforms.region": region }] };
      const movies = await Movie.find(query)
        .sort({ "ratings.tmdb.votes": -1, "ratings.tmdb.score": -1, releaseYear: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return movies.map(serializeMovieCard);
    },
    { ttlSeconds: 3600 }
  );

  return NextResponse.json({ data });
}
