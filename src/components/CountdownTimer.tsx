"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function remainingMs(deadline: number) {
  return Math.max(0, deadline - Date.now());
}

// mm:ss countdown. Neutral, then amber under 10 minutes, then red under 3.
export function CountdownTimer({
  deadline,
  active = true,
  size = "lg",
  className,
}: {
  /** epoch milliseconds */
  deadline: number;
  active?: boolean;
  size?: "md" | "lg" | "xl";
  className?: string;
}) {
  const [left, setLeft] = useState(() => remainingMs(deadline));

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setLeft(remainingMs(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline, active]);

  const total = Math.ceil(left / 1000);
  const text = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const tone = left <= 3 * 60_000 ? "text-negative-ink" : left <= 10 * 60_000 ? "text-warning-ink" : "text-fg";

  return (
    <span
      role="timer"
      suppressHydrationWarning
      className={cn(
        "money",
        size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-lg",
        active ? tone : "text-muted",
        className
      )}
    >
      {text}
    </span>
  );
}
