import { useCallback, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";
import { CountdownTimer } from "../components/CountdownTimer";
import type { Booking, RazorpayOrderPayload, Slot, Turf } from "../types";

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function Payment() {
  const { turfId, slotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { turf?: Turf; slot?: Slot } | null;

  const [order, setOrder] = useState<RazorpayOrderPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [holdSeconds] = useState(600);

  const turf = state?.turf;
  const slot = state?.slot;
  const tid = Number(turfId);
  const sid = Number(slotId);

  const startCheckout = useCallback(async () => {
    if (!Number.isFinite(tid) || !Number.isFinite(sid)) {
      toast.error("Invalid payment link");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<{
        data: RazorpayOrderPayload;
        message?: string;
      }>(`/turf/${tid}/slots/${sid}/orders`);
      const payload = data.data;
      if (!payload?.orderId || !payload.keyId) {
        throw new Error("Order response incomplete");
      }
      setOrder(payload);
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay");

      const rzp = new window.Razorpay({
        key: payload.keyId,
        amount: payload.amount,
        currency: payload.currency,
        order_id: payload.orderId,
        name: "TurfBook",
        description: "Turf slot booking",
        theme: { color: "#059669" },
        handler: async (response) => {
          setBusy(true);
          setVerifying(true);
          try {
            const verifyRes = await api.post<{
              booking: Booking & { recipts_url?: string | null };
              message?: string;
            }>(
              "/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: payload.amount,
                turfId: tid,
                slotId: sid,
              },
            );
            toast.success(verifyRes.data.message || "Payment successful");
            navigate("/booking-confirmation", {
              replace: true,
              state: {
                booking: verifyRes.data.booking,
                turf: turf ?? { id: tid, name: "Your turf" },
                slot,
                amountPaise: payload.amount,
                receiptUrl: verifyRes.data.booking?.recipts_url ?? null,
              },
            });
          } catch (e) {
            toast.error(getApiErrorMessage(e));
          } finally {
            setVerifying(false);
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [navigate, sid, slot, tid, turf]);

  if (!turf || !slot || slot.id !== sid || turf.id !== tid) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-950">
        Select a slot again from the turf page so we have booking context. This keeps the
        countdown aligned with your server-side hold.
        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const slotLabel = `${new Date(slot.start_time).toLocaleString()} → ${new Date(
    slot.end_time,
  ).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-slate-600">
          Your slot is held on the server when the payment order is created. Complete checkout within
          the timer.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{turf.name}</h2>
        <p className="text-sm text-slate-600">{turf.location}</p>
        <div className="rounded-xl bg-emerald-50/80 p-4 text-sm text-slate-800">
          <p className="font-semibold text-emerald-800">Selected slot</p>
          <p className="mt-1">{slotLabel}</p>
        </div>
        {order ? (
          <CountdownTimer
            key={order.orderId}
            totalSeconds={holdSeconds}
            onExpire={() =>
              toast.message("Hold may have expired — if payment fails, pick the slot again.", {
                duration: 6000,
              })
            }
          />
        ) : (
          <p className="text-sm text-slate-600">
            After you tap Pay now, we start a {holdSeconds / 60}-minute timer that matches your
            Redis hold window.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {order
            ? `Amount due: ₹${(order.amount / 100).toFixed(2)} ${order.currency}`
            : "Amount is calculated on the server when the order is created."}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={startCheckout}
          className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {verifying ? "Verifying payment…" : busy ? "Processing…" : order ? "Pay again" : "Pay now"}
        </button>
      </div>
    </div>
  );
}
