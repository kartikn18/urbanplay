import { Link } from "react-router-dom";
import type { Turf } from "../types";

type Props = {
  turf: Turf;
};

export function TurfCard({ turf }: Props) {
  const coverImage = turf.image_urls?.[0] || turf.image_url;
  return (
    <Link
      to={`/turf/${turf.id}`}
      state={{ turf }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-rose-300/40 hover:shadow-rose-900/20"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
        {coverImage ? (
          <img
            src={coverImage}
            alt={turf.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-sm font-medium text-slate-200">
            No image
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-rose-200 shadow">
          ₹{turf.price_per_hour} / hr
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-rose-200">
          {turf.name}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-300">{turf.location}</p>
      </div>
    </Link>
  );
}
