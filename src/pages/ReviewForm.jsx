import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StarInput from "../components/StarInput.jsx";
import { COUNTRIES } from "../lib/countries.js";
import { TYPES } from "../lib/types.js";
import { createReview, getReview, updateReview } from "../lib/api.js";

const REVIEWER_KEY = "tipple:last-reviewer";

export default function ReviewForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    type: "Beer",
    country: "Belgium",
    rating: 0,
    review: "",
    reviewer: localStorage.getItem(REVIEWER_KEY) || "",
  });
  const [preview, setPreview] = useState(null); // existing image URL or object URL
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    getReview(id)
      .then((r) => {
        setForm({
          name: r.name,
          type: r.type,
          country: r.country,
          rating: r.rating,
          review: r.review,
          reviewer: r.reviewer,
        });
        if (r.image) setPreview(r.image);
      })
      .catch((e) => setError(e.message));
  }, [id, editing]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Give your drink a name.");
    if (!form.rating) return setError("Add a star rating.");

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (file) data.append("image", file);

    setSaving(true);
    try {
      if (form.reviewer.trim()) localStorage.setItem(REVIEWER_KEY, form.reviewer.trim());
      const saved = editing ? await updateReview(id, data) : await createReview(data);
      navigate(`/drink/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="animate-rise">
      <h1 className="font-display text-2xl font-bold">
        {editing ? "Edit review" : "New review"}
      </h1>

      <form onSubmit={submit} className="mt-5 space-y-5">
        {/* Photo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface text-muted transition-colors hover:border-amber/50"
        >
          {preview ? (
            <>
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-cream backdrop-blur">
                Change photo
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1">
              <span className="text-4xl">📷</span>
              <span className="text-sm">Add a photo (optional)</span>
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickFile}
          className="hidden"
        />

        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Chimay Blue"
            className={inputClass}
            autoFocus={!editing}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
              {TYPES.map((t) => (
                <option key={t.name} value={t.name} className="bg-surface">
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country of origin">
            <select value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass}>
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-surface">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Your rating">
          <StarInput value={form.rating} onChange={(v) => set("rating", v)} />
        </Field>

        <Field label="Review">
          <textarea
            value={form.review}
            onChange={(e) => set("review", e.target.value)}
            placeholder="How was it? Aroma, taste, would you have it again…"
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field label="Reviewed by">
          <input
            value={form.reviewer}
            onChange={(e) => set("reviewer", e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-border bg-surface px-5 py-3 font-medium text-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-amber py-3 font-semibold text-bg shadow-lg shadow-amber/20 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add to archive"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-cream placeholder:text-muted/60 focus:border-amber focus:outline-none";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
