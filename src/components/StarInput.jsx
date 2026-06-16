import { useId, useState } from "react";

// Returns 0.5 if the click landed on the left half of an element, 1 if right.
function halfFromClick(e) {
  const { left, width } = e.currentTarget.getBoundingClientRect();
  return e.clientX - left < width / 2 ? 0.5 : 1;
}

// Interactive half-star picker. Tap left half of a star for .5, right half for
// full. Works with touch + mouse.
export default function StarInput({ value, onChange, size = 38 }) {
  const [hover, setHover] = useState(0);
  const gid = useId();
  const shown = hover || value;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, shown - (i - 1)));
          const id = `${gid}-${i}`;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => onChange(i - 1 + halfFromClick(e))}
              onMouseMove={(e) => setHover(i - 1 + halfFromClick(e))}
              className="transition-transform active:scale-90"
              aria-label={`Rate ${i} stars`}
            >
              <svg width={size} height={size} viewBox="0 0 24 24">
                <defs>
                  <linearGradient id={id}>
                    <stop offset={`${fill * 100}%`} stopColor="var(--color-star)" />
                    <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,0.14)" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.12-6.56L2.45 9.44l6.6-.96L12 2.5z"
                  fill={`url(#${id})`}
                />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="w-10 text-lg font-semibold text-amber tabular-nums">
        {value ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
