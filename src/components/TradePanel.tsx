"use client";

import { useState } from "react";
import { Ban, Check, CheckCircle2, Clock, Handshake, XCircle } from "lucide-react";
import { CancelTradeDialog } from "@/components/CancelTradeDialog";
import { CopyButton } from "@/components/CopyButton";
import { useI18n } from "@/components/I18nProvider";
import { MoneyAmount } from "@/components/MoneyAmount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { CancelReason, TradeStatus } from "@/lib/database.types";
import type { MessageKey } from "@/lib/i18n/messages";
import { formatRate, type Currency } from "@/lib/money";

type Leg = { currency: Currency; value: number };

// Left column of the trade room: where the trade stands, what to send and receive, and the one action.
export function TradePanel({
  status,
  iConfirmed,
  theyConfirmed,
  counterpartyName,
  send,
  receive,
  rate,
  onConfirm,
  confirming,
  confirmError,
  iAmPoster,
  cancelledBy,
  cancelReason,
  onCancel,
  cancelling,
  cancelError,
  rating,
}: {
  status: TradeStatus;
  iConfirmed: boolean;
  theyConfirmed: boolean;
  counterpartyName: string;
  send: Leg;
  receive: Leg;
  rate: number;
  onConfirm: () => void;
  confirming: boolean;
  confirmError: string | null;
  iAmPoster: boolean;
  cancelledBy: "me" | "them" | "expired";
  cancelReason: CancelReason | null;
  onCancel: (reason: CancelReason) => Promise<boolean>;
  cancelling: boolean;
  cancelError: string | null;
  rating: React.ReactNode;
}) {
  const { t, intl } = useI18n();
  const [open, setOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const locked = status === "locked";
  const completed = status === "completed";
  const cancelled = status === "cancelled";

  // Plain digits for the clipboard (no separators, so it pastes into a banking app).
  const raw = (leg: Leg) => (leg.currency === "MRU" ? String(Math.round(leg.value)) : leg.value.toFixed(2));

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
        {/* Progress */}
        <div>
          <ol className="flex items-center gap-2">
            <Step state="done" label={t("trade.step.created")} />
            <Line done={completed || locked} />
            <Step state={completed ? "done" : cancelled ? "off" : "current"} label={t("trade.step.confirm")} />
            <Line done={completed} />
            <Step state={completed ? "done" : "todo"} label={t("trade.step.done")} />
          </ol>
          {!cancelled && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ConfirmChip label={t("trade.confirm.you")} confirmed={iConfirmed} />
              <ConfirmChip label={counterpartyName} confirmed={theyConfirmed} />
            </div>
          )}
        </div>

        {/* What moves */}
        <div className="flex flex-col divide-y divide-line rounded-control border border-line">
          <AmountRow label={t("trade.send")} leg={send} intl={intl} copyValue={raw(send)} copyLabel={t("trade.copyAmount")} />
          <AmountRow label={t("trade.receive")} leg={receive} intl={intl} copyValue={raw(receive)} copyLabel={t("trade.copyAmount")} />
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="text-muted">{t("trade.rate")}</span>
            <span dir="ltr" className="money">
              {t("market.card.rate", { rate: formatRate(rate, intl) })}
            </span>
          </div>
        </div>

        {/* State-dependent action */}
        {locked && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{t("trade.pay.hint")}</p>
            {!iConfirmed ? (
              <>
                {theyConfirmed && (
                  <p className="flex items-center gap-2 rounded-control bg-info-soft px-3 py-2 text-sm text-info-ink">
                    <Clock size={16} aria-hidden="true" className="shrink-0" />
                    {t("trade.wait.you", { name: counterpartyName })}
                  </p>
                )}
                <Button size="lg" variant="buy" className="w-full" onClick={() => setOpen(true)}>
                  <Handshake size={18} aria-hidden="true" />
                  {t("trade.confirm.cta")}
                </Button>
              </>
            ) : (
              <p className="flex items-center gap-2 rounded-control bg-warning-soft px-3 py-3 text-sm text-warning-ink">
                <Clock size={16} aria-hidden="true" className="shrink-0" />
                {t("trade.wait.them", { name: counterpartyName })}
              </p>
            )}
            {confirmError && (
              <p role="alert" className="text-sm text-negative-ink">
                {confirmError}
              </p>
            )}

            {/* Walking away is possible until you have confirmed payment */}
            {iConfirmed ? (
              <p className="text-xs text-muted">{t("trade.cancel.locked")}</p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-negative-ink hover:bg-negative-soft"
                onClick={() => setCancelOpen(true)}
              >
                <Ban size={16} aria-hidden="true" />
                {t("trade.cancel.cta")}
              </Button>
            )}
          </div>
        )}

        {completed && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-control bg-positive-soft p-4 text-positive-ink">
              <CheckCircle2 size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">{t("trade.done.title")}</div>
                <div className="text-sm">{t("trade.done.body")}</div>
              </div>
            </div>
            {rating}
          </div>
        )}

        {cancelled && (
          <div className="flex items-start gap-3 rounded-control bg-surface-2 p-4">
            <XCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-muted" />
            <div>
              {cancelledBy === "expired" ? (
                <>
                  <div className="font-semibold">{t("trade.expired.title")}</div>
                  <div className="text-sm text-muted">{t("trade.expired.body")}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold">
                    {cancelledBy === "me" ? t("trade.cancelled.byYou") : t("trade.cancelled.byThem", { name: counterpartyName })}
                  </div>
                  {cancelReason && (
                    <div className="text-sm text-muted">
                      {t("trade.cancelled.reason", { reason: t(`trade.cancel.reason.${cancelReason}` as MessageKey) })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Honest notice: nothing is held in escrow */}
        <p className="flex items-start gap-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          <Handshake size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          {t("trade.p2p")}
        </p>
      </CardContent>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("trade.confirm.title")}
        description={t("trade.confirm.body", { name: counterpartyName })}
        confirmLabel={confirming ? t("trade.confirming") : t("trade.confirm.yes")}
        tone="buy"
        busy={confirming}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
      />
      <CancelTradeDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        counterpartyName={counterpartyName}
        iAmPoster={iAmPoster}
        cancelling={cancelling}
        error={cancelError}
        onCancel={onCancel}
      />
    </Card>
  );
}

function Step({ state, label }: { state: "done" | "current" | "todo" | "off"; label: string }) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-1.5 text-center" aria-current={state === "current" ? "step" : undefined}>
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs",
          state === "done" && "bg-primary text-on-primary",
          state === "current" && "bg-primary-soft text-primary-ink ring-2 ring-primary",
          (state === "todo" || state === "off") && "bg-surface-2 text-muted"
        )}
      >
        {state === "done" ? <Check size={14} aria-hidden="true" /> : state === "off" ? <XCircle size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}
      </span>
      <span className={cn("text-[11px] font-medium leading-tight", state === "todo" || state === "off" ? "text-muted" : "text-fg")}>{label}</span>
    </li>
  );
}

function Line({ done }: { done: boolean }) {
  return <li aria-hidden="true" className={cn("mb-5 h-0.5 flex-1 rounded", done ? "bg-primary" : "bg-line")} />;
}

function ConfirmChip({ label, confirmed }: { label: string; confirmed: boolean }) {
  const { t } = useI18n();
  return (
    <Badge tone={confirmed ? "positive" : "neutral"}>
      {confirmed ? <Check size={12} aria-hidden="true" /> : <Clock size={12} aria-hidden="true" />}
      <span className="max-w-32 truncate">{label}</span>: {confirmed ? t("trade.confirmed") : t("trade.pending")}
    </Badge>
  );
}

function AmountRow({
  label,
  leg,
  intl,
  copyValue,
  copyLabel,
}: {
  label: string;
  leg: Leg;
  intl: string;
  copyValue: string;
  copyLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <MoneyAmount value={leg.value} currency={leg.currency} intl={intl} size="lg" />
      </div>
      <CopyButton value={copyValue} label={copyLabel} />
    </div>
  );
}
