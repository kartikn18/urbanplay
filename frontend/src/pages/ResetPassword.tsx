import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";
import { PWD_EMAIL_KEY } from "./ForgotPassword";

const password = z
  .string()
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,20}$/,
    "4–20 characters, at least one letter and one number.",
  );

const schema = z.object({
  email: z.string().email(),
  password,
});

type FormValues = z.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const storedEmail = useMemo(() => sessionStorage.getItem(PWD_EMAIL_KEY) || "", []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: storedEmail, password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email: values.email,
        password: values.password,
      });
      sessionStorage.removeItem(PWD_EMAIL_KEY);
      toast.success("Password updated. You can log in now.");
      navigate("/login", { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  if (!storedEmail) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-amber-300/30 bg-amber-500/10 p-8 text-center text-sm text-amber-100">
        Verify your OTP first, then return here.{" "}
        <Link className="font-semibold underline" to="/verify-otp">
          Go to verify OTP
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur">
      <div>
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-300">For {storedEmail}</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register("email")} />
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="np">
            New password
          </label>
          <input
            id="np"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
