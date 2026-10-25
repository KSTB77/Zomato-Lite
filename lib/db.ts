// lib/db.ts -- the single place where the backend learns how to reach the database.
// Both API routes import `sql` from here rather than each building their own connection.

import { neon } from "@neondatabase/serverless";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Locally: check .env.local. On Vercel: add it in Project Settings > Environment Variables."
    );
  }
  // The serverless driver handles SSL itself; strip flags meant for other Postgres tools.
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("channel_binding");
  return parsed.toString();
}

export const sql = neon(databaseUrl());
