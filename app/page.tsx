// app/page.tsx -- the home page: the door of the app.
// Lists the restaurants as simple tappable cards. Reads the same API the
// restaurant page itself uses -- the frontend prints, it does not compute.

import Link from "next/link";
import { headers } from "next/headers";

type RestaurantCard = {
  id: number;
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
};

async function getRestaurants(): Promise<RestaurantCard[] | null> {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/restaurants`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function Home() {
  const restaurants = await getRestaurants();

  return (
    <main className="mx-auto max-w-[560px] px-6 pb-24 pt-16">
      <h1 className="text-2xl font-semibold tracking-tight">Restaurants</h1>
      <p className="mt-1 text-sm text-neutral-500">
        One restaurant, honestly rated.
      </p>

      {restaurants === null ? (
        <p className="mt-12 text-neutral-500">
          Could not load restaurants. Is the API awake?
        </p>
      ) : (
        <ul className="mt-8">
          {restaurants.map((r) => (
            <li key={r.id}>
              <Link
                href={`/restaurant/${r.id}`}
                className="block rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-400"
              >
                <p className="text-lg font-medium">{r.name}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {r.cuisine} · {r.area}
                </p>
                <p className="mt-2 text-sm">
                  <span className="text-amber-600">{r.averageRating}</span>
                  <span className="ml-2 text-neutral-400">
                    from {r.totalReviews} review{r.totalReviews === 1 ? "" : "s"}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
