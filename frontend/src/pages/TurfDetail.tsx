import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";
import { SlotPicker } from "../components/SlotPicker";
import type { Slot, Turf } from "../types";

function placeholderTurf(id: number): Turf {
  return {
    id,
    name: `Turf #${id}`,
    location: "Open from search for full address and photos.",
    description: "",
    price_per_hour: 0,
    image_url: "",
    lat: 0,
    lng: 0,
  };
}

export function TurfDetail() {
  const { turfId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const turfFromState = (location.state as { turf?: Turf } | null)?.turf;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);

  const id = Number(turfId);

  const displayTurf = useMemo(() => {
    if (turfFromState && turfFromState.id === id) return turfFromState;
    if (Number.isFinite(id) && id >= 1) return placeholderTurf(id);
    return null;
  }, [id, turfFromState]);

  useEffect(() => {
    if (!Number.isFinite(id) || id < 1) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<{ data: Slot[] }>(`/user/turfs/${id}/slots`);
        if (!cancelled) setSlots(data.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setSlots([]);
          toast.error(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const goPay = () => {
    if (!selected || !displayTurf) return;
    navigate(`/payment/${displayTurf.id}/${selected.id}`, {
      state: { turf: displayTurf, slot: selected },
    });
  };

  if (!Number.isFinite(id) || id < 1) {
    return (
      <p className="text-center text-sm text-red-600">
        Invalid turf.{" "}
        <Link to="/search" className="font-semibold underline">
          Back to search
        </Link>
      </p>
    );
  }

  if (!displayTurf) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {displayTurf.image_url ? (
            <img
              src={displayTurf.image_url}
              alt={displayTurf.name}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 text-lg font-semibold text-emerald-800">
              Photo unavailable
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">{displayTurf.name}</h1>
          <p className="text-slate-600">{displayTurf.location}</p>
          {displayTurf.description ? (
            <p className="text-sm leading-relaxed text-slate-700">{displayTurf.description}</p>
          ) : null}
          {displayTurf.price_per_hour > 0 ? (
            <p className="text-lg font-semibold text-emerald-700">
              ₹{displayTurf.price_per_hour} / hour
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Hourly rate appears after you open this turf from search results.
            </p>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-900">Slots</h2>
          <p className="text-sm text-slate-500">
            Open slots from the API; booked slots are hidden server-side.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading slots…</p>
        ) : (
          <>
            <SlotPicker
              slots={slots}
              selectedId={selected?.id ?? null}
              onSelect={(s) => setSelected(s)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!selected}
                onClick={goPay}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to payment
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
