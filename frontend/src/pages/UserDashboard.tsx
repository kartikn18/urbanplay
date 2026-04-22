import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";
import type { BookingHistoryItem } from "../types";

const DASHBOARD_ENDPOINT = "/user/dashboard";

function formatSlot(start: string, end: string) {
  return `${new Date(start).toLocaleString()} - ${new Date(end).toLocaleTimeString()}`;
}

export function UserDashboard() {
  const [items, setItems] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<{ data: BookingHistoryItem[] }>(DASHBOARD_ENDPOINT);
        if (!cancelled) {
          setItems(data.data ?? []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
          toast.error(getApiErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My bookings</h1>
        <p className="mt-1 text-sm text-slate-300">
          See your previous bookings and download receipts.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-300">Loading booking history...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-300">
          No booking history available yet.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.booking_id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{item.turf_name}</h2>
                  <p className="text-sm text-slate-300">{item.location}</p>
                </div>
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
                  {item.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                <p>Booking ID: #{item.booking_id}</p>
                <p>Slot: {formatSlot(item.start_time, item.end_time)}</p>
                <p>Paid: INR {(item.amount / 100).toFixed(2)}</p>
                <p>Payment: {item.payment_status}</p>
                <p>Payment ID: {item.razorpay_payment_id || "-"}</p>
                <p>Booked on: {new Date(item.created_at).toLocaleString()}</p>
              </div>
              {item.recipts_url ? (
                <div className="mt-4">
                  <a
                    href={item.recipts_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-white/10"
                  >
                    Download receipt
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
