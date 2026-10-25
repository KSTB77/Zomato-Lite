// app/review/[restaurantId]/page.tsx -- the "write a review" screen. Client component.
// It renders a name (fetched), a star picker, a comment box, one button.
// On submit it calls the API and then hands the user to the restaurant page.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Learn the id from the URL, then fetch the restaurant's name
  // so the reviewer knows exactly what they are reviewing.
  useEffect(() => {
    params.then(({ restaurantId }) => {
      const id = Number(restaurantId);
      if (!Number.isInteger(id)) {
        setMissing(true);
        return;
      }
      setRestaurantId(id);
      fetch(`/api/restaurants/${id}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setName(data.name))
        .catch(() => setMissing(true));
    });
  }, [params]);

  const canSubmit = rating >= 1 && comment.trim() !== "" && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, rating, comment }),
    });
    if (res.ok) {
      router.push(`/restaurant/${restaurantId}`);
      router.refresh();
      return;
    }
    // Show exactly what the backend said. Never invent our own message.
    const data = await res.json();
    setError(data.error ?? "Something went wrong.");
    setSubmitting(false);
  }

  if (missing) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-24">
        <p className="text-neutral-500">This restaurant does not exist.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[560px] px-6 pb-24 pt-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {name ?? "Loading…"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">How was it?</p>

      <form onSubmit={handleSubmit} className="mt-10">
        {/* Star picker -- 1 to 5, one tap each */}
        <fieldset>
          <legend className="text-sm font-medium text-neutral-700">Your rating</legend>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                className={`text-3xl transition-colors ${
                  n <= rating ? "text-amber-600" : "text-neutral-300 hover:text-neutral-400"
                }`}
              >
                {"\u2605"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Comment box */}
        <fieldset className="mt-8">
          <label htmlFor="comment" className="text-sm font-medium text-neutral-700">
            Your review
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think?"
            className="mt-3 block w-full resize-none rounded-md border border-neutral-300 bg-white p-3 text-sm leading-relaxed outline-none focus:border-neutral-500"
          />
        </fieldset>

        {/* The backend's words, displayed verbatim if it rejected us */}
        {error && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-8 w-full rounded-md bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
