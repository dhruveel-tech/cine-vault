import { NextResponse } from "next/server";
import type { FilterQuery } from "mongoose";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { movieSlug } from "@/lib/slug";
import { serializeMovieDetail } from "@/lib/serializers";
import { movieCreateSchema } from "@/lib/validations/movie";
import Movie from "@/models/Movie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSort(sort: string | null) {
  switch (sort) {
    case "rating":
      return { "ratings.tmdb.score": -1, "ratings.imdb.score": -1 };
    case "oldest":
      return { releaseYear: 1, createdAt: 1 };
    case "title":
      return { title: 1 };
    case "newest":
    default:
      return { releaseYear: -1, createdAt: -1 };
  }
}

async function createUniqueSlug(title: string, releaseYear?: number) {
  const baseSlug = movieSlug(title, releaseYear);
  let slug = baseSlug;
  let counter = 2;

  while (await Movie.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const genre = searchParams.get("genre")?.trim();
  const type = searchParams.get("type")?.trim();
  const language = searchParams.get("language")?.trim();
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);
  const skip = (page - 1) * limit;

  const query: FilterQuery<any> = {};

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { originalTitle: { $regex: q, $options: "i" } },
      { synopsis: { $regex: q, $options: "i" } },
      { genres: { $regex: q, $options: "i" } },
      { keywords: { $regex: q, $options: "i" } }
    ];
  }

  if (genre) query.genres = { $regex: genre, $options: "i" };
  if (type) query.type = type;
  if (language) query.languages = { $regex: language, $options: "i" };

  const [movies, total] = await Promise.all([
    Movie.find(query).sort(getSort(searchParams.get("sort"))).skip(skip).limit(limit).lean(),
    Movie.countDocuments(query)
  ]);

  return NextResponse.json({
    data: movies.map(serializeMovieDetail),
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = movieCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid movie payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await dbConnect();

  const payload = parsed.data;
  const releaseYear =
    payload.releaseYear ||
    (payload.releaseDate instanceof Date ? payload.releaseDate.getFullYear() : undefined);

  const slug = payload.slug || (await createUniqueSlug(payload.title, releaseYear));

  const movie = await Movie.create({
    ...payload,
    releaseDate: payload.releaseDate === "" ? undefined : payload.releaseDate,
    releaseYear,
    slug
  });

  return NextResponse.json({ data: serializeMovieDetail(movie.toObject()) }, { status: 201 });
}
