import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import type { Booking, Slot, Turf } from "../types";

type LocState = {
  booking?: Booking & { recipts_url?: string | null };
  turf?: Turf;
  slot?: Slot;
  amountPaise?: number;
  receiptUrl?: string | null;
};

export function BookingConfirmation() {
  const location = useLocation();
  const { booking, turf, slot, amountPaise, receiptUrl } = (location.state as LocState) || {};
  const [showPopup, setShowPopup] = useState(true);
  const effectiveReceiptUrl = receiptUrl ?? booking?.recipts_url ?? null;

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
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-xl shadow-black/20">
      {showPopup ? (
        <div className="rounded-2xl border border-rose-300/30 bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 p-5 text-left">
          <p className="text-base font-semibold text-white">
            Thanks for the booking by urbanplay.
          </p>
          <p className="mt-1 text-sm text-slate-200">
            You can download your receipt and view all bookings from My bookings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              My bookings
            </Link>
            {effectiveReceiptUrl ? (
              <a
                href={effectiveReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900"
              >
                Download receipt
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-white">Booking confirmed</h1>
      <p className="text-slate-300">
        Thanks for booking with urbanplay. A confirmation email may follow from the server queue.
      </p>
      <dl className="rounded-2xl bg-slate-900/70 p-6 text-left text-sm">
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-slate-400">Booking ID</dt>
          <dd className="font-semibold text-white">{booking.id}</dd>
        </div>
        {turf && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-400">Turf</dt>
            <dd className="font-semibold text-white">{turf.name}</dd>
          </div>
        )}
        {slot && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-400">Slot</dt>
            <dd className="font-semibold text-white">
              {new Date(slot.start_time).toLocaleString()} –{" "}
              {new Date(slot.end_time).toLocaleString()}
            </dd>
          </div>
        )}
        {amountPaise != null && (
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-400">Paid</dt>
            <dd className="font-semibold text-white">
              ₹{(amountPaise / 100).toFixed(2)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-slate-400">Status</dt>
          <dd className="font-semibold capitalize text-emerald-700">{booking.status}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          My bookings
        </Link>
        {effectiveReceiptUrl ? (
          <a
            href={effectiveReceiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            Download receipt
          </a>
        ) : null}
        <Link
          to="/"
          className="inline-flex rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3 font-semibold text-white hover:brightness-110"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
