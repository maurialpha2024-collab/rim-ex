import { Info } from "lucide-react";
import Link from "next/link";
import { OrderWizard } from "@/components/OrderWizard";
import { Button } from "@/components/ui/button";
import { getCurrentUser, tradeGate } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [{ profile }, { t }] = await Promise.all([getCurrentUser(), getI18n()]);
  const gate = tradeGate(profile);

  return (
    <div className="flex flex-col gap-6">
      {gate !== "ready" && gate !== "guest" && (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-card border border-line bg-info-soft p-4 text-info-ink sm:flex-row sm:items-center">
          <Info size={20} aria-hidden="true" className="shrink-0" />
          <p className="flex-1 text-sm">{t(`market.banner.${gate}` as MessageKey)}</p>
          {gate !== "no_subscription" && gate !== "suspended" && (
            <Button asChild size="sm">
              <Link href="/verify">{t("nav.verify")}</Link>
            </Button>
          )}
        </div>
      )}
      <OrderWizard
        gate={gate}
        poster={
          profile
            ? {
                id: profile.id,
                display_name: profile.display_name,
                avg_rating: profile.avg_rating,
                completed_trades_count: profile.completed_trades_count,
                verification_status: profile.verification_status,
              }
            : null
        }
      />
    </div>
  );
}
