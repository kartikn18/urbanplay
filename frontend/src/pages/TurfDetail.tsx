import { useEffect, useMemo, useRef, useState } from "react";
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
  const selectedRef = useRef<Slot | null>(null);

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
    const loadSlots = async (showInitialLoader = false) => {
      if (showInitialLoader) setLoading(true);
      try {
        const { data } = await api.get<{ data: Slot[] }>(`/user/turfs/${id}/slots`);
        if (!cancelled) {
          const latest = data.data ?? [];
          setSlots(latest);
          if (selectedRef.current && !latest.some((s) => s.id === selectedRef.current?.id)) {
            setSelected(null);
            toast.message("Selected slot is no longer available.");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setSlots([]);
          toast.error(getApiErrorMessage(e));
        }
      } finally {
        if (!cancelled && showInitialLoader) setLoading(false);
      }
    };
    void loadSlots(true);
    const intervalId = window.setInterval(() => {
      void loadSlots(false);
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const goPay = () => {
    if (!selected || !displayTurf) return;
    navigate(`/payment/${displayTurf.id}/${selected.id}`, {
      state: { turf: displayTurf, slot: selected },
    });
  };

  if (!Number.isFinite(id) || id < 1) {
    return (
      <p className="text-center text-sm text-rose-300">
        Invalid turf.{" "}
        <Link to="/search" className="font-semibold underline text-rose-200">
          Back to search
        </Link>
      </p>
    );
  }

  if (!displayTurf) return null;
  const galleryImages = displayTurf.image_urls?.length
    ? displayTurf.image_urls
    : displayTurf.image_url
      ? [displayTurf.image_url]
      : [];

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
          {galleryImages.length > 0 ? (
            <img
              src={galleryImages[0]}
              alt={displayTurf.name}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-lg font-semibold text-slate-200">
              Photo unavailable
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">{displayTurf.name}</h1>
          <p className="text-slate-300">{displayTurf.location}</p>
          {displayTurf.description ? (
            <p className="text-sm leading-relaxed text-slate-300">{displayTurf.description}</p>
          ) : null}
          {displayTurf.price_per_hour > 0 ? (
            <p className="text-lg font-semibold text-rose-300">
              ₹{displayTurf.price_per_hour} / hour
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Hourly rate appears after you open this turf from search results.
            </p>
          )}
          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {galleryImages.slice(1, 5).map((img, idx) => (
                <img
                  key={`${img}-${idx}`}
                  src={img}
                  alt={`${displayTurf.name} ${idx + 2}`}
                  className="aspect-video w-full rounded-lg border border-white/10 object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-white">Slots</h2>
          <p className="text-sm text-slate-300">
            Open slots from the API; booked slots are hidden server-side.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-300">Loading slots…</p>
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
                className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-900/25 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
