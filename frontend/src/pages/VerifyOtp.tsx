import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, extractRateLimitUntilMs, getApiErrorMessage } from "../api/axios";
import { RateLimitNotice, useRateLimitUntil } from "../components/RateLimitNotice";
import { PWD_EMAIL_KEY } from "./ForgotPassword";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type FormValues = z.infer<typeof schema>;

export function VerifyOtp() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const rateLimitBlocked = useRateLimitUntil(rateLimitUntil);
  const storedEmail = useMemo(() => sessionStorage.getItem(PWD_EMAIL_KEY) || "", []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: storedEmail, otp: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post("/auth/verify-otp", {
        email: values.email,
        otp: values.otp,
      });
      setRateLimitUntil(null);
      sessionStorage.setItem(PWD_EMAIL_KEY, values.email);
      toast.success("OTP verified");
      navigate("/reset-password");
    } catch (e) {
      const until = extractRateLimitUntilMs(e);
      if (until) setRateLimitUntil(until);
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  if (!storedEmail) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-amber-300/30 bg-amber-500/10 p-8 text-center text-sm text-amber-100">
        Start from{" "}
        <Link className="font-semibold underline" to="/forgot-password">
          forgot password
        </Link>{" "}
        so we know which email to verify.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur">
      <div>
        <h1 className="text-2xl font-bold text-white">Verify OTP</h1>
        <p className="mt-2 text-sm text-slate-300">Enter the code we emailed to {storedEmail}.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <RateLimitNotice untilMs={rateLimitUntil} />
        <input type="hidden" {...register("email")} />
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="otp">
            One-time password
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 tracking-widest text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            placeholder="000000"
            {...register("otp")}
          />
          {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting || rateLimitBlocked}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Verifying…" : rateLimitBlocked ? "Try again shortly" : "Verify"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-300">
        <Link to="/forgot-password" className="font-semibold text-rose-300 hover:underline">
          Use a different email
        </Link>
      </p>
    </div>
  );
}
