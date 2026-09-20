"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { CancelReason } from "@/lib/database.types";
import type { MessageKey } from "@/lib/i18n/messages";

const REASONS: CancelReason[] = ["changed_mind", "no_response", "payment_issue", "other"];

// Asks why, explains what happens to the ad, and only then cancels.
export function CancelTradeDialog({
  open,
  onOpenChange,
  counterpartyName,
  iAmPoster,
  cancelling,
  error,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counterpartyName: string;
  iAmPoster: boolean;
  cancelling: boolean;
  error: string | null;
  onCancel: (reason: CancelReason) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState<CancelReason>("changed_mind");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("trade.cancel.title")}</DialogTitle>
          <DialogDescription>{t("trade.cancel.body", { name: counterpartyName })}</DialogDescription>
        </DialogHeader>

        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("trade.cancel.reason")}</legend>
          {REASONS.map((value) => {
            const active = reason === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-control border px-3 py-2.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring/40",
                  active ? "border-primary bg-primary-soft text-primary-ink" : "border-line-strong hover:bg-surface-2"
                )}
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={value}
                  checked={active}
                  onChange={() => setReason(value)}
                  className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                {t(`trade.cancel.reason.${value}` as MessageKey)}
              </label>
            );
          })}
        </fieldset>

        <p className="mt-4 flex items-start gap-2 rounded-control bg-info-soft px-3 py-2 text-xs text-info-ink">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          {t(iAmPoster ? "trade.cancel.adCloses" : "trade.cancel.adReopens")}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-negative-ink">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("trade.cancel.keep")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={cancelling}
            onClick={async () => {
              if (await onCancel(reason)) onOpenChange(false);
            }}
          >
            {cancelling ? t("trade.cancel.cancelling") : t("trade.cancel.yes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
