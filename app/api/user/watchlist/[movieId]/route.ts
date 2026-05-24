import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireSignedInUserId } from "@/lib/user-library";
import dbConnect from "@/lib/mongodb";
import Movie from "@/models/Movie";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ movieId: string }> };

async function getValidUserAndMovie(movieId: string) {
  const userId = await requireSignedInUserId();
  if (!userId) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!isValidObjectId(movieId)) return { error: NextResponse.json({ error: "Invalid movie id" }, { status: 400 }) };

  await dbConnect();
  const exists = await Movie.exists({ _id: movieId });
  if (!exists) return { error: NextResponse.json({ error: "Movie not found" }, { status: 404 }) };

  return { userId };
}

export async function POST(_request: Request, context: RouteContext) {
  const { movieId } = await context.params;
  const result = await getValidUserAndMovie(movieId);
  if (result.error) return result.error;

  const user = await User.findById(result.userId).select("watchlist");
  const ids = (user?.watchlist ?? []).map((item: any) => item.toString());
  const isActive = ids.includes(movieId);

  await User.updateOne(
    { _id: result.userId },
    isActive ? { $pull: { watchlist: movieId } } : { $addToSet: { watchlist: movieId } }
  );

  return NextResponse.json({ data: { active: !isActive } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { movieId } = await context.params;
  const result = await getValidUserAndMovie(movieId);
  if (result.error) return result.error;

  await User.updateOne({ _id: result.userId }, { $pull: { watchlist: movieId } });
  return NextResponse.json({ data: { active: false } });
}
