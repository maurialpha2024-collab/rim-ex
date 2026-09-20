"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { RatingRow } from "@/lib/database.types";

// Shown once both sides confirmed payment. Each party rates the other exactly once.
export function RatingCard({
  name,
  myRating,
  theirRating,
  onSubmit,
}: {
  name: string;
  myRating: RatingRow | null;
  theirRating: RatingRow | null;
  onSubmit: (stars: number, comment: string) => Promise<string | null>;
}) {
  const { t } = useI18n();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (myRating) {
    return (
      <div className="flex flex-col gap-1.5 rounded-control bg-surface-2 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-muted">{t("rate.youRated", { name })}</span>
          <Stars value={myRating.stars} />
        </div>
        {theirRating ? (
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-muted">{t("rate.theyRated", { name })}</span>
            <Stars value={theirRating.stars} />
            {theirRating.comment && <span className="italic text-muted">“{theirRating.comment}”</span>}
          </div>
        ) : (
          <span className="text-muted">{t("rate.waiting", { name })}</span>
        )}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return;
    setSubmitting(true);
    setError(null);
    const message = await onSubmit(stars, comment.trim());
    if (message) setError(message);
    setSubmitting(false);
  }

  const shown = hover || stars;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-control bg-gold-soft p-4 text-gold-ink">
      <div>
        <div className="font-semibold">{t("rate.title", { name })}</div>
        <div className="text-sm opacity-90">{t("rate.hint")}</div>
      </div>

      <div role="radiogroup" aria-label={t("rate.group")} className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={t("rate.stars", { n })}
            onMouseEnter={() => setHover(n)}
            onClick={() => setStars(n)}
            className="rounded-control p-0.5 transition-transform hover:scale-110"
          >
            <Star size={30} aria-hidden="true" className={cn(n <= shown ? "fill-gold text-gold" : "text-gold-ink/40")} />
          </button>
        ))}
      </div>

      {stars > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            placeholder={t("rate.comment")}
            aria-label={t("rate.comment")}
            className="bg-surface text-fg"
          />
          <Button type="submit" disabled={submitting} className="shrink-0">
            {submitting ? t("rate.sending") : t("rate.submit")}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-negative-ink">
          {error}
        </p>
      )}
    </form>
  );
}

function Stars({ value }: { value: number }) {
  const { t } = useI18n();
  return (
    <span role="img" aria-label={t("rate.stars", { n: value })} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} aria-hidden="true" className={cn(n <= value ? "fill-gold text-gold" : "text-line-strong")} />
      ))}
    </span>
  );
}
