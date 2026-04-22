import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, extractRateLimitUntilMs, getApiErrorMessage } from "../api/axios";
import { RateLimitNotice, useRateLimitUntil } from "../components/RateLimitNotice";

const PWD_EMAIL_KEY = "turfbook_pwd_reset_email";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const rateLimitBlocked = useRateLimitUntil(rateLimitUntil);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setRateLimitUntil(null);
      sessionStorage.setItem(PWD_EMAIL_KEY, values.email);
      toast.success("If this email exists, we sent reset instructions.");
      navigate("/verify-otp");
    } catch (e) {
      const until = extractRateLimitUntilMs(e);
      if (until) setRateLimitUntil(until);
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur">
      <div>
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your email and we&apos;ll send a one-time code.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <RateLimitNotice untilMs={rateLimitUntil} />
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="fp-email">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || rateLimitBlocked}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Sending…" : rateLimitBlocked ? "Try again shortly" : "Send code"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-300">
        <Link to="/login" className="font-semibold text-rose-300 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export { PWD_EMAIL_KEY };
