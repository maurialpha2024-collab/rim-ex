"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { AdCard, type AdPoster } from "@/components/AdCard";
import { useI18n } from "@/components/I18nProvider";
import { MoneyAmount } from "@/components/MoneyAmount";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { TradeGate } from "@/lib/auth";
import type { OrderRow, OrderType } from "@/lib/database.types";
import type { MessageKey } from "@/lib/i18n/messages";
import { formatRate, orderLegs } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["order.step.direction", "order.step.rate", "order.step.amount", "order.step.review"] as const;

export function OrderWizard({ gate, poster }: { gate: TradeGate; poster: AdPoster | null }) {
  const { t, intl } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<OrderType>("sell_um_for_ruble");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rateNum = Number(rate);
  const amountNum = Number(amount);
  const rateOk = rateNum > 0;
  const amountOk = amountNum > 0;
  const valid = [true, rateOk, amountOk, true][step];

  const haveCurrency = type === "sell_um_for_ruble" ? "MRU" : "₽";
  const { give, want } = orderLegs(type, amountNum || 0, rateNum || 0);

  const previewOrder: OrderRow = {
    id: "preview",
    user_id: poster?.id ?? "me",
    type,
    amount: amountNum || 0,
    rate: rateNum || 0,
    status: "open",
    created_at: new Date(0).toISOString(),
  };

  function next() {
    if (!valid) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function publish() {
    if (!poster) return;
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await createClient().from("orders").insert({
      user_id: poster.id,
      type,
      amount: amountNum,
      rate: rateNum,
    });
    if (insertError) {
      setSubmitting(false);
      setError(insertError.message.includes("row-level security") ? t("market.err.notEligible") : t("common.error"));
      return;
    }
    router.push(`/?side=${type === "sell_um_for_ruble" ? "buy" : "sell"}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" />
        {t("order.back")}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">{t("order.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("order.subtitle")}</p>

      {/* Stepper */}
      <ol aria-label={t("order.steps")} className="mt-6 flex items-center gap-2">
        {STEPS.map((key, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={key} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done || current ? "bg-primary text-on-primary" : "bg-surface-2 text-muted"
                )}
              >
                {done ? <Check size={14} aria-hidden="true" /> : <bdi className="mono">{i + 1}</bdi>}
              </span>
              <span className={cn("hidden text-sm font-medium sm:inline", current ? "text-fg" : "text-muted")}>{t(key)}</span>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-line")} />}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {step === 0 && (
              <div role="radiogroup" aria-label={t("order.dir.title")} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{t("order.dir.title")}</h2>
                {(
                  [
                    ["sell_um_for_ruble", "order.dir.sellUm", "order.dir.sellUmHint", "MRU", "₽"],
                    ["sell_ruble_for_um", "order.dir.sellRub", "order.dir.sellRubHint", "₽", "MRU"],
                  ] as const
                ).map(([value, title, hint, from, to]) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setType(value)}
                      className={cn(
                        "flex items-center gap-4 rounded-card border p-4 text-start transition-colors",
                        active ? "border-primary bg-primary-soft" : "border-line-strong hover:bg-surface-2"
                      )}
                    >
                      <span dir="ltr" className="money flex items-center gap-1.5 text-lg">
                        {from}
                        <ArrowRight size={16} aria-hidden="true" />
                        {to}
                      </span>
                      <span className="flex-1">
                        <span className={cn("block font-semibold", active && "text-primary-ink")}>{t(title)}</span>
                        <span className={cn("block text-sm", active ? "text-primary-ink" : "text-muted")}>{t(hint)}</span>
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          active ? "border-primary bg-primary text-on-primary" : "border-line-strong"
                        )}
                      >
                        {active && <Check size={12} aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <Field
                htmlFor="rate"
                label={t("order.rate.label")}
                hint={t("order.rate.hint")}
                error={touched && !rateOk ? t("order.rate.error") : undefined}
              >
                <div className="relative">
                  <span dir="ltr" className="money pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted">
                    1 ₽ =
                  </span>
                  <Input
                    id="rate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    dir="ltr"
                    autoFocus
                    aria-invalid={touched && !rateOk}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0"
                    className="mono ps-14 pe-12 text-start text-lg"
                  />
                  <span dir="ltr" className="money pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted">
                    MRU
                  </span>
                </div>
              </Field>
            )}

            {step === 2 && (
              <>
                <Field
                  htmlFor="amount"
                  label={t("order.amount.label", { currency: haveCurrency })}
                  hint={t("order.amount.hint")}
                  error={touched && !amountOk ? t("order.amount.error") : undefined}
                >
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      dir="ltr"
                      autoFocus
                      aria-invalid={touched && !amountOk}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="mono pe-12 text-start text-lg"
                    />
                    <span dir="ltr" className="money pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted">
                      {haveCurrency}
                    </span>
                  </div>
                </Field>
                {amountOk && rateOk && (
                  <div className="flex items-center justify-between rounded-control bg-surface-2 px-4 py-3 text-sm">
                    <span className="text-muted">{t("order.estimate")}</span>
                    <MoneyAmount value={want.value} currency={want.currency} intl={intl} />
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">{t("order.review.title")}</h2>
                <dl className="divide-y divide-line rounded-control border border-line">
                  <Row label={t("order.review.give")}>
                    <MoneyAmount value={give.value} currency={give.currency} intl={intl} />
                  </Row>
                  <Row label={t("order.review.rate")}>
                    <span dir="ltr" className="money">
                      {t("market.card.rate", { rate: formatRate(rateNum, intl) })}
                    </span>
                  </Row>
                  <Row label={t("order.review.get")}>
                    <MoneyAmount value={want.value} currency={want.currency} intl={intl} />
                  </Row>
                </dl>
                <p className="text-sm text-muted">{t("order.review.note")}</p>
                {error && (
                  <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
                {t("common.back")}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next}>{t("common.next")}</Button>
              ) : gate === "ready" ? (
                <Button onClick={publish} disabled={submitting}>
                  {submitting ? t("order.publishing") : t("order.publish")}
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href={gate === "guest" ? "/login" : "/verify"}>
                    <ShieldAlert size={16} aria-hidden="true" />
                    {t(`market.gate.${gate}` as MessageKey)}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live preview: exactly how the ad will look in the order book */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div>
            <h2 className="text-sm font-semibold">{t("order.preview.title")}</h2>
            <p className="text-xs text-muted">{t("order.preview.hint")}</p>
          </div>
          <AdCard
            order={previewOrder}
            poster={poster}
            stats={undefined}
            side={type === "sell_um_for_ruble" ? "buy" : "sell"}
            gate="own"
            t={t}
            intl={intl}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
