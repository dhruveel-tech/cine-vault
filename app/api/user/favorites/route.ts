import { NextResponse } from "next/server";

import { requireSignedInUserId } from "@/lib/user-library";
import dbConnect from "@/lib/mongodb";
import { serializeMovieCard } from "@/lib/serializers";
import Movie from "@/models/Movie";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireSignedInUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userId).select("favorites").lean();
  const movieIds = user?.favorites ?? [];
  const movies = await Movie.find({ _id: { $in: movieIds } }).sort({ releaseYear: -1, createdAt: -1 }).lean();

  return NextResponse.json({ data: movies.map(serializeMovieCard) });
}
