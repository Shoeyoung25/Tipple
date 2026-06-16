import { useId } from "react";

// Read-only star display supporting half stars. `size` in px.
export default function Stars({ value = 0, size = 16 }) {
  const gid = useId();
  return (
    <span
      className="inline-flex items-center gap-[2px] align-middle"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1))); // 0, 0.5, or 1
        return <Star key={i} fill={fill} size={size} id={`${gid}-${i}`} />;
      })}
    </span>
  );
}

function Star({ fill, size, id }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--color-star)" />
          <stop offset={`${fill * 100}%`} stopColor="rgba(255,255,255,0.16)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.12-6.56L2.45 9.44l6.6-.96L12 2.5z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
