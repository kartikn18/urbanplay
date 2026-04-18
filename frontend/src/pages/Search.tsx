import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";
import { TurfCard } from "../components/TurfCard";
import type { Turf } from "../types";

export function Search() {
  const [params, setParams] = useSearchParams();
  const cityParam = params.get("city") || "";
  const nameParam = params.get("name") || "";
  const radiusParam = params.get("radius") || "10";

  const [city, setCity] = useState(cityParam);
  const [name, setName] = useState(nameParam);
  const [radius, setRadius] = useState(radiusParam);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCity(cityParam);
    setName(nameParam);
    setRadius(radiusParam);
  }, [cityParam, nameParam, radiusParam]);

  useEffect(() => {
    if (!cityParam.trim()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<{ data: Turf[]; message?: string }>("/user/turfs/search", {
          params: {
            city: cityParam.trim(),
            ...(nameParam ? { name: nameParam } : {}),
            radius: radiusParam ? Number(radiusParam) : 10,
          },
        });
        if (!cancelled) setTurfs(data.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setTurfs([]);
          toast.error(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cityParam, nameParam, radiusParam]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      toast.error("City is required");
      return;
    }
    const next = new URLSearchParams();
    next.set("city", city.trim());
    if (name.trim()) next.set("name", name.trim());
    if (radius) next.set("radius", String(Number(radius) || 10));
    setParams(next);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Find a turf</h1>
        <p className="mt-2 text-slate-600">Filter by city, optional name, and search radius.</p>
      </div>

      <form
        onSubmit={applyFilters}
        className="grid gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm md:grid-cols-4"
      >
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase text-slate-500">City</label>
          <input
            required
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Required"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Name contains</label>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Radius (km)</label>
          <input
            type="number"
            min={1}
            max={200}
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Search
          </button>
        </div>
      </form>

      {!cityParam ? (
        <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-sm text-slate-600">
          Enter a city to search. You can also jump from the{" "}
          <Link to="/" className="font-semibold text-emerald-700 underline">
            home page
          </Link>
          .
        </p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading turfs…</p>
      ) : turfs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
          No turfs for this query. Try another city or widen the radius.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => (
            <TurfCard key={turf.id} turf={turf} />
          ))}
        </div>
      )}
    </div>
  );
}
