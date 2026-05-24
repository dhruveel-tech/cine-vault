import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { movieSlug } from "@/lib/slug";
import { serializeMovieDetail } from "@/lib/serializers";
import { movieUpdateSchema } from "@/lib/validations/movie";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MovieRouteContext = {
  params: Promise<{ id: string }>;
};

function selector(id: string) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
}

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function GET(_request: Request, context: MovieRouteContext) {
  const { id } = await context.params;
  await dbConnect();

  const movie = await Movie.findOne(selector(id)).lean();
  if (!movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeMovieDetail(movie) });
}

export async function PUT(request: Request, context: MovieRouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = movieUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid movie update payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  const existingMovie = await Movie.findOne(selector(id));
  if (!existingMovie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  const payload = parsed.data;
  const nextReleaseYear =
    payload.releaseYear ||
    (payload.releaseDate instanceof Date ? payload.releaseDate.getFullYear() : existingMovie.releaseYear);

  if (!payload.slug && (payload.title || payload.releaseYear || payload.releaseDate)) {
    payload.slug = movieSlug(payload.title ?? existingMovie.title, nextReleaseYear);
  }

  Object.assign(existingMovie, {
    ...payload,
    releaseDate: payload.releaseDate === "" ? undefined : payload.releaseDate,
    releaseYear: nextReleaseYear
  });

  await existingMovie.save();

  return NextResponse.json({ data: serializeMovieDetail(existingMovie.toObject()) });
}

export async function DELETE(_request: Request, context: MovieRouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  await dbConnect();

  const deletedMovie = await Movie.findOneAndDelete(selector(id)).lean();
  if (!deletedMovie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeMovieDetail(deletedMovie) });
}
