import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const rootDir = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(rootDir, fileName);

  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI. Add it to .env.local, for example:');
  console.error('MONGODB_URI=mongodb://127.0.0.1:27017/cinevault');
  process.exit(1);
}

function getDatabaseName(uri) {
  try {
    const parsed = new URL(uri);
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    return dbName || "cinevault";
  } catch {
    return "cinevault";
  }
}

const now = new Date();

const movies = [
  {
    title: "Oppenheimer",
    originalTitle: "Oppenheimer",
    slug: "oppenheimer-2023",
    type: "movie",
    contentRating: "R",
    genres: ["Drama", "Biography", "History"],
    languages: ["English", "German"],
    countries: ["United States", "United Kingdom"],
    releaseDate: new Date("2023-07-21T00:00:00.000Z"),
    releaseYear: 2023,
    runtime: 180,
    status: "released",
    synopsis:
      "The story of J. Robert Oppenheimer and the scientists whose work on the Manhattan Project changed the course of history.",
    tagline: "The world forever changes.",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
    trailerKey: "uYPbbksJxIg",
    cast: [
      { name: "Cillian Murphy", character: "J. Robert Oppenheimer", order: 1 },
      { name: "Emily Blunt", character: "Kitty Oppenheimer", order: 2 },
      { name: "Matt Damon", character: "Leslie Groves", order: 3 },
      { name: "Robert Downey Jr.", character: "Lewis Strauss", order: 4 }
    ],
    crew: [
      { name: "Christopher Nolan", job: "Director", department: "Directing" },
      { name: "Christopher Nolan", job: "Writer", department: "Writing" },
      { name: "Emma Thomas", job: "Producer", department: "Production" }
    ],
    streamingPlatforms: [
      { name: "Prime Video", region: "IN", url: "https://www.primevideo.com/", type: "rent" }
    ],
    ratings: {
      imdb: { score: 8.3, votes: 850000 },
      tmdb: { score: 8.1, votes: 9500 },
      rottenTomatoes: { tomatometer: 93, audience: 91 }
    },
    budget: 100000000,
    boxOffice: { domestic: 329000000, worldwide: 976000000 },
    productionCompanies: ["Universal Pictures", "Syncopy", "Atlas Entertainment"],
    distributors: ["Universal Pictures"],
    awards: [{ name: "Academy Awards", category: "Best Picture", year: 2024, won: true }],
    keywords: ["atomic bomb", "manhattan project", "biography", "world war ii"],
    ottPlatforms: ["Prime Video"],
    tmdbId: "872585",
    imdbId: "tt15398776",
    dataSource: "manual",
    isVerified: true
  },
  {
    title: "Dune: Part Two",
    originalTitle: "Dune: Part Two",
    slug: "dune-part-two-2024",
    type: "movie",
    contentRating: "PG-13",
    genres: ["Science Fiction", "Adventure", "Drama"],
    languages: ["English"],
    countries: ["United States", "Canada"],
    releaseDate: new Date("2024-03-01T00:00:00.000Z"),
    releaseYear: 2024,
    runtime: 166,
    status: "released",
    synopsis:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    tagline: "Long live the fighters.",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    trailerKey: "Way9Dexny3w",
    cast: [
      { name: "Timothee Chalamet", character: "Paul Atreides", order: 1 },
      { name: "Zendaya", character: "Chani", order: 2 },
      { name: "Rebecca Ferguson", character: "Lady Jessica", order: 3 },
      { name: "Javier Bardem", character: "Stilgar", order: 4 }
    ],
    crew: [
      { name: "Denis Villeneuve", job: "Director", department: "Directing" },
      { name: "Denis Villeneuve", job: "Writer", department: "Writing" },
      { name: "Jon Spaihts", job: "Writer", department: "Writing" }
    ],
    streamingPlatforms: [
      { name: "JioHotstar", region: "IN", url: "https://www.hotstar.com/", type: "subscription" }
    ],
    ratings: {
      imdb: { score: 8.5, votes: 620000 },
      tmdb: { score: 8.2, votes: 7000 },
      rottenTomatoes: { tomatometer: 92, audience: 95 }
    },
    budget: 190000000,
    boxOffice: { domestic: 282000000, worldwide: 714000000 },
    productionCompanies: ["Legendary Pictures", "Warner Bros. Pictures"],
    distributors: ["Warner Bros. Pictures"],
    awards: [],
    keywords: ["desert", "spice", "fremen", "arrakis", "science fiction"],
    ottPlatforms: ["JioHotstar"],
    tmdbId: "693134",
    imdbId: "tt15239678",
    dataSource: "manual",
    isVerified: true
  },
  {
    title: "Inception",
    originalTitle: "Inception",
    slug: "inception-2010",
    type: "movie",
    contentRating: "PG-13",
    genres: ["Action", "Science Fiction", "Thriller"],
    languages: ["English", "Japanese", "French"],
    countries: ["United States", "United Kingdom"],
    releaseDate: new Date("2010-07-16T00:00:00.000Z"),
    releaseYear: 2010,
    runtime: 148,
    status: "released",
    synopsis:
      "A skilled thief who steals secrets through dream-sharing technology is offered a chance to have his criminal history erased.",
    tagline: "Your mind is the scene of the crime.",
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    trailerKey: "YoHD9XEInc0",
    cast: [
      { name: "Leonardo DiCaprio", character: "Dom Cobb", order: 1 },
      { name: "Joseph Gordon-Levitt", character: "Arthur", order: 2 },
      { name: "Elliot Page", character: "Ariadne", order: 3 },
      { name: "Tom Hardy", character: "Eames", order: 4 }
    ],
    crew: [
      { name: "Christopher Nolan", job: "Director", department: "Directing" },
      { name: "Christopher Nolan", job: "Writer", department: "Writing" },
      { name: "Emma Thomas", job: "Producer", department: "Production" }
    ],
    streamingPlatforms: [
      { name: "Prime Video", region: "IN", url: "https://www.primevideo.com/", type: "rent" }
    ],
    ratings: {
      imdb: { score: 8.8, votes: 2600000 },
      tmdb: { score: 8.4, votes: 36000 },
      rottenTomatoes: { tomatometer: 87, audience: 91 }
    },
    budget: 160000000,
    boxOffice: { domestic: 292000000, worldwide: 839000000 },
    productionCompanies: ["Legendary Pictures", "Syncopy", "Warner Bros. Pictures"],
    distributors: ["Warner Bros. Pictures"],
    awards: [{ name: "Academy Awards", category: "Best Cinematography", year: 2011, won: true }],
    keywords: ["dream", "subconscious", "heist", "mind bending", "science fiction"],
    ottPlatforms: ["Prime Video"],
    tmdbId: "27205",
    imdbId: "tt1375666",
    dataSource: "manual",
    isVerified: true
  }
];

async function seed() {
  const client = new MongoClient(mongoUri);
  await client.connect();

  const dbName = getDatabaseName(mongoUri);
  const db = client.db(dbName);

  const users = db.collection("users");
  const movieCollection = db.collection("movies");

  await users.createIndex({ email: 1 }, { unique: true });
  await movieCollection.createIndex({ slug: 1 }, { unique: true });
  await movieCollection.createIndex({ title: "text", synopsis: "text", genres: "text", keywords: "text" });

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  await users.updateOne(
    { email: "admin@cinevault.dev" },
    {
      $set: {
        name: "CineVault Admin",
        email: "admin@cinevault.dev",
        passwordHash,
        role: "admin",
        bio: "Default local development admin account.",
        updatedAt: now
      },
      $setOnInsert: {
        watchlist: [],
        favorites: [],
        blogsWritten: [],
        createdAt: now
      }
    },
    { upsert: true }
  );

  const operations = movies.map((movie) => ({
    updateOne: {
      filter: { slug: movie.slug },
      update: {
        $set: {
          ...movie,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      upsert: true
    }
  }));

  const result = await movieCollection.bulkWrite(operations, { ordered: false });

  console.log(`Connected to database: ${dbName}`);
  console.log("Seed complete.");
  console.log("Admin account: admin@cinevault.dev / Admin123!");
  console.log(`Movies inserted: ${result.upsertedCount}`);
  console.log(`Movies updated: ${result.modifiedCount}`);

  await client.close();
}

seed().catch((error) => {
  console.error("Seed failed:");
  console.error(error);
  process.exit(1);
});
