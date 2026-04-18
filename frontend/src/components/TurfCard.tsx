import { Link } from "react-router-dom";
import type { Turf } from "../types";

type Props = {
  turf: Turf;
};

export function TurfCard({ turf }: Props) {
  return (
    <Link
      to={`/turf/${turf.id}`}
      state={{ turf }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-emerald-50">
        <img
          src={turf.image_url}
          alt={turf.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-800 shadow">
          ₹{turf.price_per_hour} / hr
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
          {turf.name}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-600">{turf.location}</p>
      </div>
    </Link>
  );
}
