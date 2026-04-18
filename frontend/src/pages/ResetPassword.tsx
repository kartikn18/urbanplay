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
      <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">
        Verify your OTP first, then return here.{" "}
        <Link className="font-semibold underline" to="/verify-otp">
          Go to verify OTP
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-600">For {storedEmail}</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register("email")} />
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="np">
            New password
          </label>
          <input
            id="np"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
