import Link from "next/link";
import { Info, PackageOpen, PlusCircle, ShieldCheck } from "lucide-react";
import { AdCard, type AdPoster } from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getCurrentUser, tradeGate, type TradeGate } from "@/lib/auth";
import type { OrderRow } from "@/lib/database.types";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTraderStats } from "@/lib/trader-stats";

export const dynamic = "force-dynamic";

type Side = "buy" | "sell";
type Sort = "price" | "new" | "size";
type AdRow = OrderRow & { poster: AdPoster | null };

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string; min?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const side: Side = params.side === "sell" ? "sell" : "buy";
  const sort: Sort = params.sort === "new" || params.sort === "size" ? params.sort : "price";
  const min = Math.max(0, Number(params.min) || 0);

  const [{ authId, profile }, { t, intl }] = await Promise.all([getCurrentUser(), getI18n()]);
  const gate = tradeGate(profile);

  // Buying MRU means taking an ad from someone who sells MRU (and the other way round).
  const type = side === "buy" ? "sell_um_for_ruble" : "sell_ruble_for_um";
  const currency = side === "buy" ? "MRU" : "₽";

  // The order book is public by design (guests can browse), so it is read with the
  // server-side client and only public fields are selected.
  let query = createAdminClient()
    .from("orders")
    .select(
      "id, user_id, type, amount, rate, status, created_at, poster:users!orders_user_id_fkey(id, display_name, avg_rating, completed_trades_count, verification_status)"
    )
    .eq("status", "open")
    .eq("type", type);
  if (min > 0) query = query.gte("amount", min);
  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : sort === "size"
        ? query.order("amount", { ascending: false })
        : // Best price: buyers of MRU want the most MRU per ₽, sellers of MRU the fewest.
          query.order("rate", { ascending: side === "sell" });

  const { data } = await query;
  const ads = (data ?? []) as unknown as AdRow[];
  const stats = await getTraderStats(ads.map((a) => a.user_id));

  const hrefFor = (next: Partial<{ side: Side }>) => {
    const q = new URLSearchParams();
    q.set("side", next.side ?? side);
    if (min > 0) q.set("min", String(min));
    if (sort !== "price") q.set("sort", sort);
    return `/?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("market.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("market.subtitle", { count: ads.length })}</p>
          <p className="mt-0.5 text-xs text-muted">{t("market.currencies")}</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck size={16} aria-hidden="true" className="text-brand" />
          {t("trust.verifiedTraders")} · {t("trust.p2p")}
        </p>
      </div>

      {gate !== "ready" && <GateBanner gate={gate} t={t} />}

      {/* Buy / Sell toggle (sticky under the header on small screens) */}
      <div className="sticky top-16 z-30 -mx-4 bg-canvas/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0">
        <nav aria-label={t("market.side.label")} className="grid grid-cols-2 gap-1 rounded-card border border-line bg-surface p-1 sm:max-w-md">
          {(["buy", "sell"] as const).map((s) => {
            const active = side === s;
            return (
              <Link
                key={s}
                href={hrefFor({ side: s })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-[12px] px-4 py-2.5 text-center transition-colors",
                  active
                    ? s === "buy"
                      ? "bg-positive-solid text-on-primary"
                      : "bg-negative-solid text-on-primary"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                <div className="text-sm font-semibold">{t(s === "buy" ? "market.side.buy" : "market.side.sell")}</div>
                <div className={cn("text-[11px]", active ? "opacity-90" : "opacity-70")}>
                  {t(s === "buy" ? "market.side.buyHint" : "market.side.sellHint")}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <form action="/" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="side" value={side} />
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:w-56">
          {t("market.filter.min", { currency })}
          <Input name="min" type="number" inputMode="decimal" min="0" step="any" defaultValue={min || ""} placeholder="0" dir="ltr" className="mono" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:w-56">
          {t("market.filter.sort")}
          <Select name="sort" defaultValue={sort}>
            <option value="price">{t("market.sort.price")}</option>
            <option value="new">{t("market.sort.new")}</option>
            <option value="size">{t("market.sort.size")}</option>
          </Select>
        </label>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            {t("market.filter.apply")}
          </Button>
          {(min > 0 || sort !== "price") && (
            <Button asChild variant="ghost">
              <Link href={`/?side=${side}`}>{t("market.filter.reset")}</Link>
            </Button>
          )}
        </div>
      </form>

      {/* Ads */}
      {ads.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <PackageOpen size={32} aria-hidden="true" className="text-muted" />
          <p className="font-semibold">{t("market.empty.title")}</p>
          <p className="text-sm text-muted">{t("market.empty.hint")}</p>
          <Button asChild className="mt-2">
            <Link href="/orders/new">
              <PlusCircle size={16} aria-hidden="true" />
              {t("market.empty.cta")}
            </Link>
          </Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {ads.map((ad) => (
            <li key={ad.id}>
              <AdCard
                order={ad}
                poster={ad.poster}
                stats={stats.get(ad.user_id)}
                side={side}
                gate={authId && ad.user_id === authId ? "own" : gate}
                t={t}
                intl={intl}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GateBanner({ gate, t }: { gate: Exclude<TradeGate, "ready">; t: (key: MessageKey) => string }) {
  const cta: Partial<Record<typeof gate, { href: string; label: MessageKey }>> = {
    guest: { href: "/login", label: "market.banner.cta.guest" },
    unverified: { href: "/verify", label: "market.banner.cta.unverified" },
    pending: { href: "/verify", label: "market.banner.cta.pending" },
    rejected: { href: "/verify", label: "market.banner.cta.rejected" },
  };
  const action = cta[gate];
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-info-soft p-4 text-info-ink sm:flex-row sm:items-center">
      <Info size={20} aria-hidden="true" className="shrink-0" />
      <p className="flex-1 text-sm">{t(`market.banner.${gate}` as MessageKey)}</p>
      {action && (
        <Button asChild size="sm" variant="primary">
          <Link href={action.href}>{t(action.label)}</Link>
        </Button>
      )}
    </div>
  );
}
