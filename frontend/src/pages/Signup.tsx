import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../api/axios";

const password = z
  .string()
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,20}$/,
    "4–20 characters, at least one letter and one number.",
  );

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password,
  role: z.enum(["user", "admin"]),
});

type FormValues = z.infer<typeof schema>;

export function Signup() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "user" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/signup", values);
      toast.success((data as { message?: string }).message || "Account created");
      navigate("/login", { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/20 backdrop-blur">
      <div>
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-300">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-rose-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="su-email">
            Email
          </label>
          <input
            id="su-email"
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
          <label className="text-sm font-medium text-slate-200" htmlFor="su-password">
            Password
          </label>
          <input
            id="su-password"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-400 outline-none ring-rose-400 focus:ring-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200" htmlFor="su-role">
            Role
          </label>
          <select
            id="su-role"
            className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
            {...register("role")}
            defaultValue="user"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
