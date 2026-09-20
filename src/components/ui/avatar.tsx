import { cn } from "@/lib/cn";

// Solid tones that all keep white initials at >= 4.5:1.
const TONES = [
  "bg-primary",
  "bg-positive-solid",
  "bg-info-solid",
  "bg-warning-solid",
  "bg-negative-solid",
  "bg-primary-hover",
];

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const label = (name ?? "?").trim();
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-on-primary",
        TONES[hash % TONES.length],
        className
      )}
    >
      {label.charAt(0).toUpperCase() || "?"}
    </span>
  );
}
