import { Link, useLocation } from "react-router-dom";
import type { Booking, Slot, Turf } from "../types";

type LocState = {
  booking?: Booking;
  turf?: Turf;
  slot?: Slot;
  amountPaise?: number;
};

export function BookingConfirmation() {
  const location = useLocation();
  const { booking, turf, slot, amountPaise } = (location.state as LocState) || {};

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-950">
        No booking details found. Start from a turf and complete payment to see this screen.
        <div className="mt-4">
          <Link to="/search?city=Mumbai" className="font-semibold text-emerald-700 underline">
            Find turfs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Booking confirmed</h1>
      <p className="text-slate-600">
        Thanks for booking with TurfBook. A confirmation email may follow from the server queue.
      </p>
      <dl className="rounded-2xl bg-emerald-50/60 p-6 text-left text-sm">
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-slate-500">Booking ID</dt>
          <dd className="font-semibold text-slate-900">{booking.id}</dd>
        </div>
        {turf && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500">Turf</dt>
            <dd className="font-semibold text-slate-900">{turf.name}</dd>
          </div>
        )}
        {slot && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500">Slot</dt>
            <dd className="font-semibold text-slate-900">
              {new Date(slot.start_time).toLocaleString()} –{" "}
              {new Date(slot.end_time).toLocaleString()}
            </dd>
          </div>
        )}
        {amountPaise != null && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500">Paid</dt>
            <dd className="font-semibold text-slate-900">
              ₹{(amountPaise / 100).toFixed(2)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-slate-500">Status</dt>
          <dd className="font-semibold capitalize text-emerald-700">{booking.status}</dd>
        </div>
      </dl>
      <Link
        to="/"
        className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
      >
        Back to home
      </Link>
    </div>
  );
}
