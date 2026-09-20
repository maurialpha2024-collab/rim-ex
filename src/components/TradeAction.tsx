"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { TradeGate } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n/messages";

// The single action on an ad. When the visitor can't trade yet it stays visible and
// explains why ("Verify to trade") instead of silently disappearing.
export function TradeAction({
  orderId,
  side,
  gate,
  posterName,
}: {
  orderId: string;
  side: "buy" | "sell";
  gate: TradeGate | "own";
  posterName: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (gate === "own") {
    return (
      <Button variant="outline" disabled>
        {t("market.action.own")}
      </Button>
    );
  }

  if (gate !== "ready") {
    return (
      <Button asChild variant="outline">
        <Link href={gate === "guest" ? "/login" : "/verify"}>
          <ShieldAlert size={16} aria-hidden="true" />
          {t(`market.gate.${gate}` as MessageKey)}
        </Link>
      </Button>
    );
  }

  async function accept() {
    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("accept_order", { p_order_id: orderId });
    if (rpcError) {
      setBusy(false);
      setOpen(false);
      const message = rpcError.message;
      setError(
        message.includes("not eligible")
          ? t("market.err.notEligible")
          : message.includes("not available")
            ? t("market.err.unavailable")
            : message.includes("own order")
              ? t("market.err.own")
              : t("common.error")
      );
      router.refresh();
      return;
    }
    router.push(`/trade/${(data as { id: string }).id}`);
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <Button variant={side === "buy" ? "buy" : "sell"} onClick={() => setOpen(true)}>
        {t(side === "buy" ? "market.action.buy" : "market.action.sell")}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-negative-ink">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("market.confirm.title")}
        description={t("market.confirm.body", { name: posterName })}
        confirmLabel={busy ? t("market.locking") : t("market.confirm.cta")}
        tone={side === "buy" ? "buy" : "sell"}
        busy={busy}
        onConfirm={accept}
      />
    </div>
  );
}
