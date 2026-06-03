import { Link } from "react-router-dom";
import Stars from "./Stars.jsx";
import { flag } from "../lib/countries.js";
import { typeEmoji } from "../lib/types.js";

// Poster-style card used in the archive grid.
export default function ReviewCard({ review }) {
  return (
    <Link
      to={`/drink/${review.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-amber/50 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        {review.image ? (
          <img
            src={review.image}
            alt={review.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-2 to-bg text-6xl">
            {typeEmoji(review.type)}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium backdrop-blur">
          {flag(review.country)} {review.country}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate font-semibold leading-tight" title={review.name}>
          {review.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted">{review.type}</p>
        <div className="mt-2 flex items-center justify-between">
          <Stars value={review.rating} size={14} />
          {review.reviewer && (
            <span className="truncate text-[11px] text-muted">{review.reviewer}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
