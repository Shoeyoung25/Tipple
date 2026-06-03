import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ReviewCard from "../components/ReviewCard.jsx";
import { getReviews } from "../lib/api.js";
import { COUNTRIES } from "../lib/countries.js";
import { TYPES } from "../lib/types.js";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
  { value: "name", label: "A–Z" },
  { value: "oldest", label: "Oldest" },
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [reviews, setReviews] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState(null);

  // Country / type / reviewer live in the URL so links from the Browse page
  // (and shared links between friends) deep-link straight into a filtered view.
  const country = params.get("country") || "";
  const type = params.get("type") || "";
  const reviewer = params.get("reviewer") || "";

  function setParam(key, val) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val) next.set(key, val);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setError(null);
      getReviews({ search, country, type, reviewer, sort })
        .then(setReviews)
        .catch((e) => setError(e.message));
    }, 180);
    return () => clearTimeout(t);
  }, [search, country, type, reviewer, sort]);

  const filtering = country || type || reviewer || search;

  return (
    <div className="animate-rise">
      <SearchBar value={search} onChange={setSearch} />

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <Select value={sort} onChange={setSort} options={SORTS} icon="↕" />
        <Select
          value={type}
          onChange={(v) => setParam("type", v)}
          icon="🥃"
          options={[{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t.name, label: t.name }))]}
        />
        <Select
          value={country}
          onChange={(v) => setParam("country", v)}
          icon="🌍"
          options={[{ value: "", label: "All countries" }, ...COUNTRIES.map((c) => ({ value: c.name, label: `${c.flag} ${c.name}` }))]}
        />
        {filtering && (
          <button
            onClick={() => {
              setSearch("");
              setParams({}, { replace: true });
            }}
            className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-cream"
          >
            Clear
          </button>
        )}
      </div>

      {reviewer && (
        <div className="mt-3">
          <button
            onClick={() => setParam("reviewer", "")}
            className="rounded-full bg-amber/15 px-3 py-1.5 text-sm text-amber"
          >
            👤 {reviewer} ✕
          </button>
        </div>
      )}

      {error && <p className="mt-8 text-center text-red-300">{error}</p>}

      {reviews === null && !error && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {reviews && reviews.length === 0 && <Empty filtering={filtering} />}

      {reviews && reviews.length > 0 && (
        <>
          <p className="mt-4 text-sm text-muted">
            {reviews.length} {reviews.length === 1 ? "drink" : "drinks"}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your archive…"
        className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-cream placeholder:text-muted/70 focus:border-amber focus:outline-none"
      />
    </div>
  );
}

function Select({ value, onChange, options, icon }) {
  return (
    <label className="relative shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-border bg-surface py-1.5 pl-8 pr-7 text-sm text-cream focus:border-amber focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-cream">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </label>
  );
}

function Empty({ filtering }) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <p className="text-6xl">🍺</p>
      <h2 className="mt-4 font-display text-xl font-bold">
        {filtering ? "No drinks match" : "Your cellar is empty"}
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        {filtering
          ? "Try clearing the filters to see everything you've reviewed."
          : "Pour your first review and start building the archive."}
      </p>
      {!filtering && (
        <Link
          to="/add"
          className="mt-6 inline-block rounded-full bg-amber px-6 py-2.5 font-semibold text-bg shadow-lg shadow-amber/20 active:scale-95"
        >
          + Add a review
        </Link>
      )}
    </div>
  );
}
