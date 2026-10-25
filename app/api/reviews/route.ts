// app/api/reviews/route.ts -- answers on POST /api/reviews.
// The kitchen's order window: validate the order, then write exactly one fact.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  // The request body arrives as JSON text; parse it once, defensively.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = body as {
    restaurantId?: number;
    rating?: number;
    comment?: string;
  };

  // Check 1: rating is a whole number from 1 to 5.
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Check 2: comment is non-empty after trimming stray spaces.
  if (typeof comment !== "string" || comment.trim() === "") {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 }
    );
  }

  // Check 3: the restaurant the review points at must actually exist.
  // (Also guards against restaurantId being a non-number, which would break the lookup.)
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "restaurantId must be a number." },
      { status: 400 }
    );
  }
  const existing = await sql`SELECT id FROM restaurants WHERE id = ${restaurantId}`;
  if (existing.length === 0) {
    return NextResponse.json(
      { error: "This restaurant does not exist." },
      { status: 400 }
    );
  }

  // All three checks passed: write exactly one fact into the reviews table.
  const inserted = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${comment.trim()})
    RETURNING id
  `;

  return NextResponse.json(
    { success: true, reviewId: inserted[0].id },
    { status: 201 }
  );
}
