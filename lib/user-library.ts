import { isValidObjectId } from "mongoose";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export type UserLibraryState = {
  isAuthenticated: boolean;
  isInWatchlist: boolean;
  isFavorite: boolean;
};

export async function getMovieLibraryState(movieId: string): Promise<UserLibraryState> {
  const session = await auth();
  if (!session?.user?.id || !isValidObjectId(movieId)) {
    return { isAuthenticated: Boolean(session?.user), isInWatchlist: false, isFavorite: false };
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("watchlist favorites").lean();
  const id = movieId.toString();
  const watchlist = (user?.watchlist ?? []).map((item: any) => item.toString());
  const favorites = (user?.favorites ?? []).map((item: any) => item.toString());

  return {
    isAuthenticated: true,
    isInWatchlist: watchlist.includes(id),
    isFavorite: favorites.includes(id)
  };
}

export async function requireSignedInUserId() {
  const session = await auth();
  return session?.user?.id || null;
}
