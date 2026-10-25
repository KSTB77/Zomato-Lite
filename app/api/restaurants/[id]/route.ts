// app/api/restaurants/[id]/route.ts -- answers on GET /api/restaurants/<id>.
// This is the intelligence of the product: store facts, compute answers.
// The response is deliberately shaped like the screen, top to bottom.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// The driver returns rows typed as "Record<string, unknown>" -- an object whose
// keys we cannot trust until we coerce them. This function IS that trust boundary.
function toReview(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  const restaurants = await sql`
    SELECT id, name, cuisine, area FROM restaurants WHERE id = ${restaurantId}
  `;
  if (restaurants.length === 0) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 404 }
    );
  }
  const { name, cuisine, area } = restaurants[0];

  // THE THREE LINES OF INTELLIGENCE -- computed fresh on every load, never stored:

  // 1. AVG(rating) -- the answer, not a fact. Rounded to one decimal here in the backend.
  const stats = await sql`
    SELECT AVG(rating) AS average, COUNT(*) AS total
    FROM reviews WHERE restaurant_id = ${restaurantId}
  `;
  const average = stats[0].average === null
    ? null
    : Math.round(Number(stats[0].average) * 10) / 10;
  const totalReviews = Number(stats[0].total);

  // 2 & 3. Every review this restaurant has, newest first...
  const rows = await sql`
    SELECT id, rating, comment, created_at
    FROM reviews WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC, id DESC
  `;

  // ...and the split the screen wants: the newest one is highlighted,
  // the rest are printed below. The latest is never printed twice.
  const latestRow = rows[0] ?? null;
  const olderRows = rows.slice(1);

  // The "nothing here yet" case, decided deliberately:
  // a brand-new restaurant has no average (null -- not 0, 0 would pretend we know),
  // totalReviews 0, no latest review, and an empty list.
  return NextResponse.json({
    name,
    cuisine,
    area,
    averageRating: average,
    totalReviews,
    latestReview: latestRow ? toReview(latestRow) : null,
    reviews: olderRows.map(toReview),
  });
}
