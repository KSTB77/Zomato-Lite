// app/api/restaurants/route.ts -- answers on GET /api/restaurants (no id).
// The list endpoint, built because the home page now IS a list.
// Same intelligence as the [id] route, applied to every restaurant at once:
// AVG(rating) computed fresh, COUNT(*) computed, nothing ever stored.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  // LEFT JOIN so a restaurant with zero reviews still appears (COUNT = 0, AVG = null).
  const rows = await sql`
    SELECT
      r.id, r.name, r.cuisine, r.area,
      AVG(rv.rating) AS average,
      COUNT(rv.id)   AS total
    FROM restaurants r
    LEFT JOIN reviews rv ON rv.restaurant_id = r.id
    GROUP BY r.id, r.name, r.cuisine, r.area
    ORDER BY r.id
  `;

  return NextResponse.json(
    rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      cuisine: String(row.cuisine),
      area: String(row.area),
      averageRating:
        row.average === null ? null : Math.round(Number(row.average) * 10) / 10,
      totalReviews: Number(row.total),
    }))
  );
}
