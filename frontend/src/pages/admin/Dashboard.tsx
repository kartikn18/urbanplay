import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "../../api/axios";

const turfSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  price: z.coerce.number().positive(),
});

type TurfForm = z.infer<typeof turfSchema>;

const slotSchema = z.object({
  name: z.string().min(1, "Turf name (must match a turf you created)"),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

type SlotForm = z.infer<typeof slotSchema>;

export function Dashboard() {
  const [image, setImage] = useState<File | null>(null);
  const [turfSubmitting, setTurfSubmitting] = useState(false);
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  const turfForm = useForm<TurfForm>({ resolver: zodResolver(turfSchema) });
  const slotForm = useForm<SlotForm>({ resolver: zodResolver(slotSchema) });

  const onCreateTurf = turfForm.handleSubmit(async (values) => {
    if (!image) {
      toast.error("Please choose an image (JPEG, PNG, or WEBP).");
      return;
    }
    setTurfSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("description", values.description);
      fd.append("address", values.address);
      fd.append("city", values.city);
      fd.append("price", String(values.price));
      fd.append("image", image);
      await api.post("/admin/turf", fd);
      toast.success("Turf created");
      turfForm.reset();
      setImage(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setTurfSubmitting(false);
    }
  });

  const onCreateSlot = slotForm.handleSubmit(async (values) => {
    setSlotSubmitting(true);
    try {
      await api.post("/admin/slot", {
        name: values.name,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      });
      toast.success("Slot created");
      slotForm.reset();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSlotSubmitting(false);
    }
  });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="mt-2 text-slate-600">
          Create turfs with multipart uploads and add slots against a turf you own.
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Create turf</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fields align with your handler: name, description, address, city, price, image file.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onCreateTurf}>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...turfForm.register("name")}
            />
            {turfForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">City (for geocoding)</label>
            <input
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...turfForm.register("city")}
            />
            {turfForm.formState.errors.city && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.city.message}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <input
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...turfForm.register("address")}
            />
            {turfForm.formState.errors.address && (
              <p className="mt-1 text-xs text-red-600">
                {turfForm.formState.errors.address.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...turfForm.register("description")}
            />
            {turfForm.formState.errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {turfForm.formState.errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Price / hour (INR)</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...turfForm.register("price")}
            />
            {turfForm.formState.errors.price && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.price.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 w-full text-sm"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={turfSubmitting}
              className="rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {turfSubmitting ? "Saving…" : "Create turf"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Create slot</h2>
        <p className="mt-1 text-sm text-slate-500">
          Backend resolves turf by exact <strong>name</strong> you created under your admin account.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onCreateSlot}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Turf name</label>
            <input
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...slotForm.register("name")}
            />
            {slotForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{slotForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Start</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...slotForm.register("startTime")}
            />
            {slotForm.formState.errors.startTime && (
              <p className="mt-1 text-xs text-red-600">
                {slotForm.formState.errors.startTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">End</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              {...slotForm.register("endTime")}
            />
            {slotForm.formState.errors.endTime && (
              <p className="mt-1 text-xs text-red-600">{slotForm.formState.errors.endTime.message}</p>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={slotSubmitting}
              className="rounded-xl bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {slotSubmitting ? "Saving…" : "Create slot"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
