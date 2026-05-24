import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ProfileLibraryClient from "@/components/profile/ProfileLibraryClient";
import dbConnect from "@/lib/mongodb";
import { serializeMovieCard } from "@/lib/serializers";
import Movie from "@/models/Movie";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const user = await User.findById(session.user.id).select("name email role watchlist favorites").lean();

  const [watchlistRaw, favoritesRaw] = await Promise.all([
    Movie.find({ _id: { $in: user?.watchlist ?? [] } }).sort({ releaseYear: -1, createdAt: -1 }).limit(24).lean(),
    Movie.find({ _id: { $in: user?.favorites ?? [] } }).sort({ releaseYear: -1, createdAt: -1 }).limit(24).lean()
  ]);

  return (
    <ProfileLibraryClient
      user={{
        name: user?.name || session.user.name || "Profile",
        email: user?.email || session.user.email || "",
        role: user?.role || session.user.role || "user"
      }}
      initialWatchlist={watchlistRaw.map(serializeMovieCard)}
      initialFavorites={favoritesRaw.map(serializeMovieCard)}
    />
  );
}
