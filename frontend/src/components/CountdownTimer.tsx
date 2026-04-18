import { useEffect, useRef, useState } from "react";

type Props = {
  /** Countdown length in seconds */
  totalSeconds: number;
  /** Fires once when timer hits zero */
  onExpire?: () => void;
};

export function CountdownTimer({ totalSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(totalSeconds);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [totalSeconds]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const urgent = remaining <= 120;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
        urgent
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden />
      Hold expires in{" "}
      <span className="tabular-nums">
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}
