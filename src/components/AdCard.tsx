import { CheckCircle2, Clock, Star } from "lucide-react";
import { MoneyAmount } from "@/components/MoneyAmount";
import { TradeAction } from "@/components/TradeAction";
import { TrustBadge } from "@/components/TrustBadge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { TradeGate } from "@/lib/auth";
import type { OrderRow, UserRow } from "@/lib/database.types";
import type { TFn } from "@/lib/i18n";
import { formatPercent, formatRate, orderLegs } from "@/lib/money";
import type { TraderStats } from "@/lib/trader-stats";

export type AdPoster = Pick<
  UserRow,
  | "id"
  | "display_name"
  | "avg_rating"
  | "completed_trades_count"
  | "verification_status"
>;

// One ad in the order book: who (trust) · what price and size · one clear action.
export function AdCard({
  order,
  poster,
  stats,
  side,
  gate,
  t,
  intl,
}: {
  order: OrderRow;
  poster: AdPoster | null;
  stats: TraderStats | undefined;
  side: "buy" | "sell";
  gate: TradeGate | "own";
  t: TFn;
  intl: string;
}) {
  const name = poster?.display_name ?? t("market.card.anonymous");
  const { give, want } = orderLegs(order.type, order.amount, order.rate);
  const rated = (poster?.completed_trades_count ?? 0) > 0;

  return (
    <Card className="@container">
      <div className="grid gap-4 p-5 @2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] @2xl:items-center @2xl:gap-6">
        {/* Who */}
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={name} size={44} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold">{name}</span>
              <TrustBadge
                verified={poster?.verification_status === "verified"}
                verifiedLabel={t("badge.verified")}
                newLabel={t("badge.new")}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Star
                  size={13}
                  aria-hidden="true"
                  className="fill-gold text-gold"
                />
                <bdi className="mono">
                  {rated ? Number(poster?.avg_rating ?? 0).toFixed(1) : "—"}
                </bdi>
              </span>
              {stats ? (
                <>
                  <span>
                    {t("market.card.trades30", { n: stats.trades30d })}
                  </span>
                  {stats.completionRate !== null && (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {t("market.card.completion", {
                        p: formatPercent(stats.completionRate, intl),
                      })}
                    </span>
                  )}
                  {stats.avgReleaseMin !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden="true" />
                      {t("market.card.release", {
                        m: Math.max(1, Math.round(stats.avgReleaseMin)),
                      })}
                    </span>
                  )}
                </>
              ) : (
                <span>{t("market.card.noStats")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Price and size */}
        <div>
          <div className="text-xs text-muted">{t("market.card.rateLabel")}</div>
          <div dir="ltr" className="money text-2xl text-fg">
            {t("market.card.rate", { rate: formatRate(order.rate, intl) })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted">
                {t("market.card.receive")}
              </div>
              <MoneyAmount
                value={give.value}
                currency={give.currency}
                intl={intl}
              />
            </div>
            <div>
              <div className="text-xs text-muted">{t("market.card.pay")}</div>
              <MoneyAmount
                value={want.value}
                currency={want.currency}
                intl={intl}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">{t("market.card.fixed")}</p>
        </div>

        {/* Action */}
        <div className="@2xl:min-w-44">
          <TradeAction
            orderId={order.id}
            side={side}
            gate={gate}
            posterName={name}
          />
        </div>
      </div>
    </Card>
  );
}
