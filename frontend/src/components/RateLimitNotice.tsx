import { useEffect, useState } from "react";

function formatRemaining(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/**
 * Live countdown for auth rate limits (matches backend `retry_after` TTL seconds).
 */
export function useRateLimitUntil(untilMs: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (untilMs === null || Date.now() >= untilMs) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [untilMs]);

  return untilMs !== null && now < untilMs;
}

export function RateLimitNotice({ untilMs }: { untilMs: number | null }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (untilMs === null) {
      setSecondsLeft(0);
      return;
    }
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((untilMs - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [untilMs]);

  if (untilMs === null || secondsLeft <= 0) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      You&apos;ve hit the limit for this step. Try again in{" "}
      <span className="font-semibold tabular-nums">{formatRemaining(secondsLeft)}</span>
      .
    </div>
  );
}
