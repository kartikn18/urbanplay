import type { Slot } from "../types";

function formatRange(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  return `${a.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} – ${b.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

type Props = {
  slots: Slot[];
  selectedId: number | null;
  onSelect: (slot: Slot) => void;
};

export function SlotPicker({ slots, selectedId, onSelect }: Props) {
  if (slots.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm text-slate-600">
        No open slots right now. Check back soon or try another turf.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => {
        const available = !slot.is_booked;
        const active = selectedId === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={!available}
            onClick={() => available && onSelect(slot)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              !available
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : active
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                  : "border-emerald-100 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            <div className="font-semibold">{formatRange(slot.start_time, slot.end_time)}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide opacity-90">
              {available ? "Available" : "Booked"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
