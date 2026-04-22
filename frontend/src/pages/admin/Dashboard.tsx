import { type ChangeEvent, useRef, useState } from "react";
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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;

function notifyActionError(action: string, err: unknown) {
  toast.error(`${action} failed: ${getApiErrorMessage(err)}`);
}

export function Dashboard() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [turfSubmitting, setTurfSubmitting] = useState(false);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [deleteTurfSubmitting, setDeleteTurfSubmitting] = useState(false);
  const [deleteSlotSubmitting, setDeleteSlotSubmitting] = useState(false);
  const [deleteTurfId, setDeleteTurfId] = useState("");
  const [deleteSlotTurfId, setDeleteSlotTurfId] = useState("");
  const [deleteSlotId, setDeleteSlotId] = useState("");

  const turfForm = useForm<TurfForm>({ resolver: zodResolver(turfSchema) });
  const slotForm = useForm<SlotForm>({ resolver: zodResolver(slotSchema) });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) {
      setImages([]);
      return;
    }
    if (picked.length > MAX_IMAGE_COUNT) {
      toast.error(`Only ${MAX_IMAGE_COUNT} images can be uploaded at once.`);
    }
    const limited = picked.slice(0, MAX_IMAGE_COUNT);
    setImages(limited);
  };

  const onCreateTurf = turfForm.handleSubmit(async (values) => {
    const fallbackFiles = Array.from(imageInputRef.current?.files ?? []).slice(0, MAX_IMAGE_COUNT);
    const filesToUpload = images.length > 0 ? images : fallbackFiles;
    if (filesToUpload.length === 0) {
      toast.error("Please choose at least one image (JPEG, PNG, or WEBP).");
      return;
    }
    if (filesToUpload.length > MAX_IMAGE_COUNT) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }
    if (filesToUpload.some((img) => img.size > MAX_IMAGE_BYTES)) {
      toast.error("Each image must be 5 MB or smaller.");
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
      filesToUpload.forEach((img) => fd.append("image", img));
      await api.post("/admin/turf", fd);
      toast.success("Turf created");
      turfForm.reset();
      setImages([]);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (e) {
      notifyActionError("Create turf", e);
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
      notifyActionError("Create slot", e);
    } finally {
      setSlotSubmitting(false);
    }
  });

  const onDeleteTurf = async () => {
    const id = Number(deleteTurfId);
    if (!Number.isFinite(id) || id < 1) {
      toast.error("Enter a valid turf id.");
      return;
    }
    setDeleteTurfSubmitting(true);
    try {
      await api.post("/admin/deleteturf", { id });
      toast.success("Turf deleted");
      setDeleteTurfId("");
    } catch {
      // fallback for param-based route variants
      try {
        await api.post(`/admin/deleteturf/${id}`);
        toast.success("Turf deleted");
        setDeleteTurfId("");
      } catch (e) {
        notifyActionError("Delete turf", e);
      }
    } finally {
      setDeleteTurfSubmitting(false);
    }
  };

  const onDeleteSlot = async () => {
    const turfid = Number(deleteSlotTurfId);
    const slotid = Number(deleteSlotId);
    if (!Number.isFinite(turfid) || turfid < 1 || !Number.isFinite(slotid) || slotid < 1) {
      toast.error("Enter valid turf id and slot id.");
      return;
    }
    setDeleteSlotSubmitting(true);
    try {
      await api.post("/admin/deleteslot", { turfid, slotid });
      toast.success("Slot deleted");
      setDeleteSlotId("");
      setDeleteSlotTurfId("");
    } catch {
      // fallback for param-based route variants
      try {
        await api.post(`/admin/deleteslot/${turfid}/${slotid}`);
        toast.success("Slot deleted");
        setDeleteSlotId("");
        setDeleteSlotTurfId("");
      } catch (e) {
        notifyActionError("Delete slot", e);
      }
    } finally {
      setDeleteSlotSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin dashboard</h1>
        <p className="mt-2 text-slate-300">
          Create turfs with multipart uploads and add slots against a turf you own.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Create turf</h2>
        <p className="mt-1 text-sm text-slate-300">
          Fields align with your handler: name, description, address, city, price, and up to 5 images.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onCreateTurf}>
          <div>
            <label className="text-sm font-medium text-slate-200">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...turfForm.register("name")}
            />
            {turfForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">City (for geocoding)</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...turfForm.register("city")}
            />
            {turfForm.formState.errors.city && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.city.message}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-200">Address</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...turfForm.register("address")}
            />
            {turfForm.formState.errors.address && (
              <p className="mt-1 text-xs text-red-600">
                {turfForm.formState.errors.address.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-200">Description</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...turfForm.register("description")}
            />
            {turfForm.formState.errors.description && (
              <p className="mt-1 text-xs text-red-600">
                {turfForm.formState.errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Price / hour (INR)</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...turfForm.register("price")}
            />
            {turfForm.formState.errors.price && (
              <p className="mt-1 text-xs text-red-600">{turfForm.formState.errors.price.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Images (max 5)</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 p-2 text-sm text-slate-200"
              onChange={handleImageChange}
            />
            <p className="mt-1 text-xs text-slate-400">
              JPEG, PNG, or WebP, max 5 MB each. Selected: {images.length}
            </p>
            {images.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {images.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-amber-200/90">
                No files selected yet. Please pick 1 to 5 images.
              </p>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={turfSubmitting}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
            >
              {turfSubmitting ? "Saving…" : "Create turf"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Create slot</h2>
        <p className="mt-1 text-sm text-slate-300">
          Backend resolves turf by exact <strong>name</strong> you created under your admin account.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onCreateSlot}>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-200">Turf name</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...slotForm.register("name")}
            />
            {slotForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{slotForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Start</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
              {...slotForm.register("startTime")}
            />
            {slotForm.formState.errors.startTime && (
              <p className="mt-1 text-xs text-red-600">
                {slotForm.formState.errors.startTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">End</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-white outline-none ring-rose-400 focus:ring-2"
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
              className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-2 font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110 disabled:opacity-60"
            >
              {slotSubmitting ? "Saving…" : "Create slot"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-300/30 bg-red-500/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Delete turf</h2>
        <p className="mt-1 text-sm text-slate-300">Permanently remove a turf by its id.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="number"
            min={1}
            value={deleteTurfId}
            onChange={(e) => setDeleteTurfId(e.target.value)}
            className="w-full rounded-xl border border-red-300/30 bg-slate-900/70 px-3 py-2 text-white outline-none ring-red-400 focus:ring-2"
            placeholder="Turf id"
          />
          <button
            type="button"
            disabled={deleteTurfSubmitting}
            onClick={onDeleteTurf}
            className="rounded-xl bg-red-600 px-6 py-2 font-semibold text-white shadow-lg shadow-red-950/35 hover:bg-red-700 disabled:opacity-60"
          >
            {deleteTurfSubmitting ? "Deleting…" : "Delete turf"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-300/30 bg-red-500/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Delete slot</h2>
        <p className="mt-1 text-sm text-slate-300">
          Remove a specific slot using turf id and slot id.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="number"
            min={1}
            value={deleteSlotTurfId}
            onChange={(e) => setDeleteSlotTurfId(e.target.value)}
            className="w-full rounded-xl border border-red-300/30 bg-slate-900/70 px-3 py-2 text-white outline-none ring-red-400 focus:ring-2"
            placeholder="Turf id"
          />
          <input
            type="number"
            min={1}
            value={deleteSlotId}
            onChange={(e) => setDeleteSlotId(e.target.value)}
            className="w-full rounded-xl border border-red-300/30 bg-slate-900/70 px-3 py-2 text-white outline-none ring-red-400 focus:ring-2"
            placeholder="Slot id"
          />
          <button
            type="button"
            disabled={deleteSlotSubmitting}
            onClick={onDeleteSlot}
            className="rounded-xl bg-red-600 px-6 py-2 font-semibold text-white shadow-lg shadow-red-950/35 hover:bg-red-700 disabled:opacity-60"
          >
            {deleteSlotSubmitting ? "Deleting…" : "Delete slot"}
          </button>
        </div>
      </section>
    </div>
  );
}
