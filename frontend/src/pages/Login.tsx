import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, extractRateLimitUntilMs, getApiErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { RateLimitNotice, useRateLimitUntil } from "../components/RateLimitNotice";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const rateLimitBlocked = useRateLimitUntil(rateLimitUntil);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.post<{ data: { accesstoken: string }; message?: string }>(
        "/auth/login",
        values,
      );
      const token = data.data?.accesstoken;
      if (!token) throw new Error("Missing access token");
      login(token);
      setRateLimitUntil(null);
      toast.success(data.message || "Logged in");
      navigate(from, { replace: true });
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
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-300">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-rose-300 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <RateLimitNotice untilMs={rateLimitUntil} />
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-rose-300 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={submitting || rateLimitBlocked}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : rateLimitBlocked ? "Try again shortly" : "Log in"}
        </button>
      </form>
    </div>
  );
}
