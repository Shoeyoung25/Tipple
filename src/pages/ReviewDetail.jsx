import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Stars from "../components/Stars.jsx";
import { getReview, deleteReview } from "../lib/api.js";
import { flag } from "../lib/countries.js";
import { typeEmoji } from "../lib/types.js";

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getReview(id).then(setReview).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    await deleteReview(id);
    navigate("/");
  }

  if (error) return <p className="mt-8 text-center text-red-300">{error}</p>;
  if (!review) return <p className="mt-8 text-center text-muted">Loading…</p>;

  const date = new Date(review.created_at + "Z").toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-rise">
      <button onClick={() => navigate(-1)} className="mb-3 text-sm text-muted hover:text-cream">
        ← Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative aspect-[4/3] bg-surface-2 sm:aspect-[16/10]">
          {review.image ? (
            <img src={review.image} alt={review.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-2 to-bg text-8xl">
              {typeEmoji(review.type)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <Link
              to={`/?country=${encodeURIComponent(review.country)}`}
              className="inline-block rounded-full bg-black/50 px-3 py-1 text-sm backdrop-blur"
            >
              {flag(review.country)} {review.country}
            </Link>
          </div>
        </div>

        <div className="p-5">
          <h1 className="font-display text-3xl font-bold leading-tight">{review.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <Link to={`/?type=${encodeURIComponent(review.type)}`} className="text-amber-soft">
              {review.type}
            </Link>
            <span>·</span>
            <span>{date}</span>
            {review.reviewer && (
              <>
                <span>·</span>
                <Link to={`/?reviewer=${encodeURIComponent(review.reviewer)}`}>
                  reviewed by <span className="text-cream">{review.reviewer}</span>
                </Link>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
            <Stars value={review.rating} size={26} />
            <span className="text-2xl font-bold text-amber tabular-nums">
              {review.rating.toFixed(1)}
              <span className="text-base font-normal text-muted">/5</span>
            </span>
          </div>

          {review.review && (
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-cream/90">{review.review}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              to={`/edit/${review.id}`}
              className="flex-1 rounded-xl border border-border bg-surface-2 py-2.5 text-center font-medium hover:border-amber/50"
            >
              ✎ Edit
            </Link>
            {confirming ? (
              <div className="flex flex-1 gap-2">
                <button
                  onClick={remove}
                  className="flex-1 rounded-xl bg-red-500/90 py-2.5 font-medium text-white"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-xl border border-border px-4"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex-1 rounded-xl border border-border bg-surface-2 py-2.5 font-medium text-red-300 hover:border-red-400/40"
              >
                🗑 Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
