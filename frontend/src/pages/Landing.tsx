import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { TurfCard } from "../components/TurfCard";
import type { Turf } from "../types";

export function Landing() {
  const [city, setCity] = useState("");
  const [featured, setFeatured] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ data: Turf[] }>("/user/turfs/search", {
          params: { city: "Mumbai", radius: 25 },
        });
        if (!cancelled) setFeatured(data.data ?? []);
      } catch {
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm md:grid-cols-2 md:p-12">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Book in minutes
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Find and book premium turfs near you.
          </h1>
          <p className="text-lg text-slate-600">
            Search by city, compare hourly rates, lock a slot, and pay securely with Razorpay.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const q = city.trim() || "Mumbai";
              window.location.assign(`/search?city=${encodeURIComponent(q)}`);
            }}
          >
            <input
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
              placeholder="Enter city (e.g. Mumbai)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700"
            >
              Search turfs
            </button>
          </form>
        </div>
        <div className="relative hidden overflow-hidden rounded-2xl bg-emerald-600 p-8 text-white md:block">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-black/10" />
          <div className="relative space-y-4">
            <h2 className="text-2xl font-bold">Tonight&apos;s pitch is yours.</h2>
            <p className="text-emerald-50">
              Real-time availability, instant holds, and quick checkout — built for players who
              hate phone tag.
            </p>
            <Link
              to="/signup"
              className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Search your city",
              body: "Filter turfs by distance and name to find the right surface and price.",
            },
            {
              step: "2",
              title: "Pick a slot",
              body: "Choose an open time block. We hold it briefly while you complete payment.",
            },
            {
              step: "3",
              title: "Pay & play",
              body: "Checkout with Razorpay. Your booking is confirmed instantly after verification.",
            },
          ].map((c) => (
            <div
              key={c.step}
              className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {c.step}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Featured turfs</h2>
          <Link to="/search?city=Mumbai" className="text-sm font-semibold text-emerald-700 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading featured turfs…</p>
        ) : featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-sm text-slate-600">
            No sample listings loaded. Try searching a city you play in.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((turf) => (
              <TurfCard key={turf.id} turf={turf} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
