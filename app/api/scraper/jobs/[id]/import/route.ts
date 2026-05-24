import mongoose from "mongoose";
import type { Collection } from "mongodb";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { serializeMovieDetail } from "@/lib/serializers";
import { movieSlug } from "@/lib/slug";
import { mapMovieJsonToMoviePayload } from "@/lib/scraper-mapper";
import { serializeScraperJob } from "@/lib/scraper-serializers";
import { movieCreateSchema } from "@/lib/validations/movie";
import ScraperJob from "@/models/ScraperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

type PlainRecord = Record<string, any>;

function jsonError(message: string, status = 500, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected import error";
}

function omitEmpty(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => omitEmpty(item))
      .filter((item) => item !== undefined && item !== null && item !== "");
  }

  if (value instanceof Date) return value;

  if (value && typeof value === "object") {
    const output: PlainRecord = {};

    for (const [key, nestedValue] of Object.entries(value as PlainRecord)) {
      const cleaned = omitEmpty(nestedValue);
      if (cleaned !== undefined && cleaned !== null && cleaned !== "") {
        if (typeof cleaned === "object" && !(cleaned instanceof Date) && !Array.isArray(cleaned) && Object.keys(cleaned as PlainRecord).length === 0) {
          continue;
        }
        output[key] = cleaned;
      }
    }

    return output;
  }

  return value === undefined ? undefined : value;
}

async function createUniqueSlug(movies: Collection, title: string, releaseYear?: number) {
  const baseSlug = movieSlug(title, releaseYear);
  let slug = baseSlug;
  let counter = 2;

  while (await movies.findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid scraper job id", 400);
    }

    const job = await ScraperJob.findById(id);

    if (!job) {
      return jsonError("Scraper job not found", 404);
    }

    if (!job.result || job.status === "failed") {
      return jsonError("Only completed scraper jobs can be imported", 400);
    }

    const payload = mapMovieJsonToMoviePayload(job.result as any);
    const parsed = movieCreateSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Scraper result cannot be imported", 400, parsed.error.flatten());
    }

    const movies = mongoose.connection.collection("movies");
    const duplicateQueries = [
      parsed.data.tmdbId ? { tmdbId: parsed.data.tmdbId } : null,
      parsed.data.imdbId ? { imdbId: parsed.data.imdbId } : null
    ].filter(Boolean) as Array<Record<string, string>>;

    const existingMovie = duplicateQueries.length > 0 ? await movies.findOne({ $or: duplicateQueries }) : null;

    if (existingMovie) {
      job.status = "imported";
      job.importedMovie = existingMovie._id;
      job.importedAt = new Date();
      await job.save();

      return NextResponse.json({
        data: {
          job: serializeScraperJob(job.toObject()),
          movie: serializeMovieDetail(existingMovie),
          alreadyExisted: true
        }
      });
    }

    const parsedReleaseDate = parsed.data.releaseDate instanceof Date ? parsed.data.releaseDate : undefined;
    const releaseYear = parsed.data.releaseYear || parsedReleaseDate?.getFullYear();
    const slug = await createUniqueSlug(movies, parsed.data.title, releaseYear);
    const now = new Date();

    const movieDocument = omitEmpty({
      ...parsed.data,
      releaseDate: parsedReleaseDate,
      releaseYear,
      slug,
      createdAt: now,
      updatedAt: now
    }) as PlainRecord;

    const insertResult = await movies.insertOne(movieDocument);
    const insertedMovie = await movies.findOne({ _id: insertResult.insertedId });

    if (!insertedMovie) {
      return jsonError("Movie import succeeded, but the inserted movie could not be reloaded", 500);
    }

    job.status = "imported";
    job.importedMovie = insertResult.insertedId;
    job.importedAt = now;
    await job.save();

    return NextResponse.json({
      data: {
        job: serializeScraperJob(job.toObject()),
        movie: serializeMovieDetail(insertedMovie),
        alreadyExisted: false
      }
    });
  } catch (error) {
    console.error("[scraper-import]", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return jsonError("MongoDB validation failed while importing this movie", 400, error.message);
    }

    if ((error as { code?: number })?.code === 11000) {
      return jsonError("A movie with this unique value already exists", 409, error);
    }

    return jsonError(getErrorMessage(error), 500);
  }
}
