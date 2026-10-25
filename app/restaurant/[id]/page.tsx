// app/restaurant/[id]/page.tsx -- the restaurant page. Server component.
// It calls GET /api/restaurants/[id] -- the same endpoint curl hit in M3 --
// and prints what it receives. It renders; it does not calculate.

import Link from "next/link";
import { headers } from "next/headers";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

async function getRestaurant(id: string): Promise<RestaurantData | null> {
  // Build the absolute URL to our own API from the incoming request's host,
  // so this works identically on localhost and on the live Vercel URL.
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/restaurants/${id}`, {
    cache: "no-store", // fresh data on every page load, like the lesson says
  });
  if (!res.ok) return null;
  return res.json();
}

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-24">
        <p className="text-neutral-500">This restaurant does not exist.</p>
      </main>
    );
  }

  const hasReviews = restaurant.totalReviews > 0;

  return (
    <main className="mx-auto max-w-[560px] px-6 pb-24 pt-16">
      {/* Name */}
      <h1 className="text-3xl font-semibold tracking-tight">{restaurant.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {restaurant.cuisine} · {restaurant.area}
      </p>

      {/* The average -- printed, not computed. THIS IS THE LINE: */}
      {/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */}
      <div className="mt-10 flex items-baseline gap-3">
        <p className="text-6xl font-semibold tracking-tight" data-testid="average-rating">
          {hasReviews ? restaurant.averageRating : "–"}
        </p>
        <p className="text-sm text-neutral-500">
          from {restaurant.totalReviews} review{restaurant.totalReviews === 1 ? "" : "s"}
        </p>
      </div>
      {/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */}

      {hasReviews && restaurant.latestReview ? (
        <>
          {/* Latest review -- sits apart from the rest on purpose */}
          <section className="mt-10 rounded-lg border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Latest review
            </p>
            <p className="mt-2 text-lg leading-relaxed">
              {restaurant.latestReview.comment}
            </p>
            <p className="mt-3 text-sm">
              <span className="text-amber-600">{stars(restaurant.latestReview.rating)}</span>
              <span className="ml-3 text-neutral-400">{shortDate(restaurant.latestReview.createdAt)}</span>
            </p>
          </section>

          {/* Older reviews */}
          <section className="mt-10">
            <ul className="divide-y divide-neutral-200">
              {restaurant.reviews.map((review) => (
                <li key={review.id} className="py-4">
                  <p className="leading-relaxed">{review.comment}</p>
                  <p className="mt-2 text-sm">
                    <span className="text-amber-600">{stars(review.rating)}</span>
                    <span className="ml-3 text-neutral-400">{shortDate(review.createdAt)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        /* Empty state -- the "nothing yet" case the API decided for us */
        <section className="mt-12 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-neutral-500">No reviews yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Be the first to say what you thought.</p>
        </section>
      )}

      {/* The one action this page offers */}
      <Link
        href={`/review/${id}`}
        className="mt-12 block rounded-md bg-neutral-900 py-3 text-center text-sm font-medium text-white hover:bg-neutral-700"
      >
        Write a review
      </Link>
    </main>
  );
}
