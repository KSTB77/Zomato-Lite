// scripts/db-setup.mjs -- connects to Neon, applies db/schema.sql, then db/seed.sql,
// then prints the rows it created. Run it with `npm run db:setup`.
// Safe to run again: it always wipes and rebuilds to the same clean state.

import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

function readDatabaseUrl() {
  const envPath = path.join(process.cwd(), ".env.local");
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("DATABASE_URL="));
  if (!line) {
    throw new Error("DATABASE_URL not found in .env.local");
  }
  // The Neon driver handles SSL itself, so we strip flags meant for other Postgres tools.
  const url = new URL(line.slice("DATABASE_URL=".length).trim());
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return url.toString();
}

// One reusable SQL runner, pointed at our database.
const sql = neon(readDatabaseUrl());

function statements(file) {
  return fs
    .readFileSync(path.join(process.cwd(), file), "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

try {
  for (const statement of statements("db/schema.sql")) {
    await sql.query(statement);
  }
  console.log("Schema applied: restaurants + reviews tables created.");

  for (const statement of statements("db/seed.sql")) {
    await sql.query(statement);
  }
  console.log("Seed applied: 1 restaurant, 3 reviews.");

  const restaurants = await sql`SELECT * FROM restaurants`;
  const reviews = await sql`SELECT * FROM reviews ORDER BY created_at`;

  // Show the user the actual facts now stored in the database.
  console.table(restaurants);
  console.table(
    reviews.map((r) => ({
      id: r.id,
      restaurant_id: r.restaurant_id,
      rating: r.rating,
      comment: r.comment,
      created_at: new Date(r.created_at).toISOString().replace("T", " ").slice(0, 16),
    }))
  );
} catch (err) {
  console.error("db:setup failed:", err.message);
  process.exit(1);
}
