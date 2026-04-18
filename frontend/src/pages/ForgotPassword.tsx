import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";

const PWD_EMAIL_KEY = "turfbook_pwd_reset_email";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      sessionStorage.setItem(PWD_EMAIL_KEY, values.email);
      toast.success("If this email exists, we sent reset instructions.");
      navigate("/verify-otp");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we&apos;ll send a one-time code.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="fp-email">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send code"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export { PWD_EMAIL_KEY };
