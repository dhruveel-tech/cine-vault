import { NextResponse } from "next/server";

import { requireSignedInUserId } from "@/lib/user-library";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireSignedInUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userId).select("watchlist favorites").lean();

  return NextResponse.json({
    data: {
      watchlist: (user?.watchlist ?? []).map((item: any) => item.toString()),
      favorites: (user?.favorites ?? []).map((item: any) => item.toString())
    }
  });
}
