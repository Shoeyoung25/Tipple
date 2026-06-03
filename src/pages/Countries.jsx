import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Stars from "../components/Stars.jsx";
import { getStats } from "../lib/api.js";
import { flag } from "../lib/countries.js";

export default function Countries() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="mt-8 text-center text-red-300">{error}</p>;
  if (!stats) return <p className="mt-8 text-center text-muted">Loading…</p>;

  return (
    <div className="animate-rise space-y-8">
      <section>
        <h1 className="font-display text-2xl font-bold">Browse by country</h1>
        <p className="mt-1 text-sm text-muted">
          {stats.total} {stats.total === 1 ? "drink" : "drinks"} from {stats.byCountry.length}{" "}
          {stats.byCountry.length === 1 ? "country" : "countries"}
        </p>
      </section>

      {stats.byCountry.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center text-muted">
          No countries yet — add a review to fill the map.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stats.byCountry.map((c) => (
            <Link
              key={c.country}
              to={`/?country=${encodeURIComponent(c.country)}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:border-amber/50"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{flag(c.country)}</span>
                <span>
                  <span className="block font-semibold">{c.country}</span>
                  <span className="block text-xs text-muted">
                    {c.n} {c.n === 1 ? "drink" : "drinks"}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Stars value={Math.round(c.avg * 2) / 2} size={13} />
                <span className="text-sm tabular-nums text-amber">{c.avg.toFixed(1)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {stats.byType.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">By type</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.byType.map((t) => (
              <Link
                key={t.type}
                to={`/?type=${encodeURIComponent(t.type)}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-amber/50"
              >
                {t.type} <span className="text-muted">· {t.n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {stats.reviewers.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">Reviewers</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.reviewers.map((r) => (
              <Link
                key={r.reviewer}
                to={`/?reviewer=${encodeURIComponent(r.reviewer)}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-amber/50"
              >
                👤 {r.reviewer} <span className="text-muted">· {r.n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
