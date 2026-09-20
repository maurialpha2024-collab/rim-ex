import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleAlert, Clock, Star, type LucideIcon } from "lucide-react";
import { MoneyAmount } from "@/components/MoneyAmount";
import SignOutButton from "@/components/SignOutButton";
import { StatusPill, verificationKey } from "@/components/StatusPill";
import { TrustBadge } from "@/components/TrustBadge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth";
import type { OrderRow, RatingRow, TradeRow } from "@/lib/database.types";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import { formatDate, formatPercent, orderLegs } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { getTraderStats } from "@/lib/trader-stats";

export const dynamic = "force-dynamic";

type Review = RatingRow & { trade: { buyer_id: string; seller_id: string } | null };

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export default async function ProfilePage() {
  const [{ authId, profile }, { t, intl }] = await Promise.all([getCurrentUser(), getI18n()]);
  if (!authId || !profile) redirect("/login");

  const supabase = await createClient();
  const [{ data: authData }, { data: tradeData }, { data: reviewData }, statsMap] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("trades")
      .select("*")
      .or(`buyer_id.eq.${authId},seller_id.eq.${authId}`)
      .order("locked_at", { ascending: false })
      .limit(100),
    supabase
      .from("ratings")
      .select("*, trade:trades(buyer_id, seller_id)")
      .eq("rated_user", authId)
      .order("created_at", { ascending: false })
      .limit(50),
    getTraderStats([authId]),
  ]);

  const trades = (tradeData ?? []) as TradeRow[];
  const reviews = (reviewData ?? []) as unknown as Review[];
  const stats = statsMap.get(authId);
  const emailConfirmed = !!authData.user?.email_confirmed_at;

  // Order types (to know which currency each trade is denominated in) and reviewer names.
  const orderIds = [...new Set(trades.map((tr) => tr.order_id))];
  const reviewerIds = [...new Set(reviews.map((r) => r.rated_by))];
  const [{ data: orderData }, { data: reviewerData }] = await Promise.all([
    orderIds.length ? supabase.from("orders").select("id, type").in("id", orderIds) : Promise.resolve({ data: [] }),
    reviewerIds.length ? supabase.from("users").select("id, display_name").in("id", reviewerIds) : Promise.resolve({ data: [] }),
  ]);
  const types = new Map(((orderData ?? []) as Pick<OrderRow, "id" | "type">[]).map((o) => [o.id, o.type]));
  const reviewers = new Map(
    ((reviewerData ?? []) as { id: string; display_name: string | null }[]).map((u) => [u.id, u.display_name])
  );

  const umOf = (tr: TradeRow) => {
    const { give, want } = orderLegs(types.get(tr.order_id) ?? "sell_um_for_ruble", tr.amount, tr.rate);
    return give.currency === "MRU" ? give.value : want.value;
  };
  const completed = trades.filter((tr) => tr.status === "completed");
  const volume = completed.reduce((sum, tr) => sum + umOf(tr), 0);
  const monthStart = startOfMonth();
  const thisMonth = completed.filter((tr) => tr.completed_at && new Date(tr.completed_at).getTime() >= monthStart).length;
  const positive = reviews.length ? reviews.filter((r) => r.stars >= 4).length / reviews.length : null;

  // In the DB the "seller" is the party that buys MRU (see accept_order), so the review tabs
  // use the MRU point of view: bought MRU = DB seller, sold MRU = DB buyer.
  const boughtUm = reviews.filter((r) => r.trade?.seller_id === authId);
  const soldUm = reviews.filter((r) => r.trade?.buyer_id === authId);

  const verification = verificationKey(profile.verification_status);
  const verified = profile.verification_status === "verified";
  const rated = profile.completed_trades_count > 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Identity */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar name={profile.display_name} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight">{profile.display_name}</h1>
              <TrustBadge verified={verified} verifiedLabel={t("badge.verified")} newLabel={t("profile.newMember")} />
            </div>
            <p className="mt-1 text-sm text-muted">{t("profile.memberSince", { date: formatDate(profile.created_at, intl) })}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={verification} label={t(`status.${verification}` as MessageKey)} />
              <Badge tone={profile.subscription_status === "active" ? "positive" : "neutral"}>
                {t(profile.subscription_status === "active" ? "profile.sub.active" : "profile.sub.inactive")}
              </Badge>
              {profile.is_suspended && <StatusPill status="suspended" label={t("profile.suspended")} />}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!verified && (
              <Button asChild>
                <Link href="/verify">{t("profile.verifyCta")}</Link>
              </Button>
            )}
            <SignOutButton />
          </div>
        </CardContent>
      </Card>

      {/* Trust summary */}
      <section aria-labelledby="trust" className="flex flex-col gap-3">
        <h2 id="trust" className="text-sm font-semibold text-muted">
          {t("profile.trust.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label={t("profile.rating")}>
            <span className="inline-flex items-center gap-1.5">
              <Star size={20} aria-hidden="true" className="fill-gold text-gold" />
              <bdi className="mono">{rated ? Number(profile.avg_rating).toFixed(1) : "—"}</bdi>
            </span>
            <span className="mt-0.5 block text-xs font-normal text-muted">{t("profile.ratingCount", { n: reviews.length })}</span>
          </Tile>
          <Tile label={t("profile.completed")}>
            <bdi className="mono">{profile.completed_trades_count}</bdi>
          </Tile>
          <Tile label={t("profile.completion30")}>
            <bdi className="mono">{stats?.completionRate != null ? formatPercent(stats.completionRate, intl) : "—"}</bdi>
          </Tile>
          <Tile label={t("profile.release")}>
            <bdi className="mono">
              {stats?.avgReleaseMin != null ? t("profile.minutes", { m: Math.max(1, Math.round(stats.avgReleaseMin)) }) : "—"}
            </bdi>
          </Tile>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification checklist */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.checklist.title")}</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-line">
            <CheckRow
              label={t("profile.check.whatsapp")}
              state={profile.whatsapp_number ? "ok" : "todo"}
              text={t(profile.whatsapp_number ? "profile.check.provided" : "profile.check.missing")}
            />
            <CheckRow
              label={t("profile.check.passport")}
              state={verified ? "ok" : verification === "pending" ? "wait" : "todo"}
              text={t(`status.${verification}` as MessageKey)}
            />
            <CheckRow
              label={t("profile.check.email")}
              state={emailConfirmed ? "ok" : "todo"}
              text={t(emailConfirmed ? "profile.check.confirmed" : "profile.check.unconfirmed")}
            />
            <CheckRow
              label={t("profile.check.subscription")}
              state={profile.subscription_status === "active" ? "ok" : "todo"}
              text={t(profile.subscription_status === "active" ? "status.active" : "status.inactive")}
            />
          </ul>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.stats.title")}</CardTitle>
          </CardHeader>
          <dl className="divide-y divide-line text-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5">
              <dt className="text-muted">{t("profile.volume")}</dt>
              <dd>
                <MoneyAmount value={volume} currency="MRU" intl={intl} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5">
              <dt className="text-muted">{t("profile.monthTrades")}</dt>
              <dd className="mono font-semibold">{thisMonth}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3.5">
              <dt className="text-muted">{t("profile.positive")}</dt>
              <dd className="mono font-semibold">{positive !== null ? formatPercent(positive, intl) : "—"}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.reviews.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bought">
            <TabsList>
              <TabsTrigger value="bought">
                {t("profile.reviews.bought")} <bdi className="mono text-xs opacity-70">{boughtUm.length}</bdi>
              </TabsTrigger>
              <TabsTrigger value="sold">
                {t("profile.reviews.sold")} <bdi className="mono text-xs opacity-70">{soldUm.length}</bdi>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bought">
              <ReviewList reviews={boughtUm} reviewers={reviewers} empty={t("profile.reviews.empty")} noComment={t("profile.reviews.noComment")} intl={intl} />
            </TabsContent>
            <TabsContent value="sold">
              <ReviewList reviews={soldUm} reviewers={reviewers} empty={t("profile.reviews.empty")} noComment={t("profile.reviews.noComment")} intl={intl} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trade history */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.history.title")}</CardTitle>
        </CardHeader>
        {trades.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">{t("profile.history.empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {trades.slice(0, 10).map((tr) => (
              <li key={tr.id}>
                <Link href={`/trade/${tr.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-2">
                  <div className="min-w-0">
                    <MoneyAmount value={umOf(tr)} currency="MRU" intl={intl} />
                    <div suppressHydrationWarning className="text-xs text-muted">
                      {formatDate(tr.locked_at, intl)}
                    </div>
                  </div>
                  <StatusPill status={tr.status} label={t(`status.${tr.status}` as MessageKey)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{children}</div>
    </Card>
  );
}

function CheckRow({ label, state, text }: { label: string; state: "ok" | "wait" | "todo"; text: string }) {
  const Icon: LucideIcon = state === "ok" ? CheckCircle2 : state === "wait" ? Clock : CircleAlert;
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
      <span className="flex items-center gap-2.5">
        <Icon
          size={18}
          aria-hidden="true"
          className={cn(state === "ok" ? "text-positive" : state === "wait" ? "text-warning" : "text-muted")}
        />
        {label}
      </span>
      <span className={cn("text-xs font-medium", state === "ok" ? "text-positive-ink" : state === "wait" ? "text-warning-ink" : "text-muted")}>{text}</span>
    </li>
  );
}

function ReviewList({
  reviews,
  reviewers,
  empty,
  noComment,
  intl,
}: {
  reviews: Review[];
  reviewers: Map<string, string | null>;
  empty: string;
  noComment: string;
  intl: string;
}) {
  if (reviews.length === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y divide-line">
      {reviews.map((r) => {
        const name = reviewers.get(r.rated_by) ?? "—";
        return (
          <li key={r.id} className="flex items-start gap-3 py-3">
            <Avatar name={name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{name}</span>
                <span suppressHydrationWarning className="shrink-0 text-xs text-muted">
                  {formatDate(r.created_at, intl)}
                </span>
              </div>
              <span className="mt-0.5 inline-flex gap-0.5" role="img" aria-label={`${r.stars}/5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={13} aria-hidden="true" className={n <= r.stars ? "fill-gold text-gold" : "text-line-strong"} />
                ))}
              </span>
              <p className="mt-1 text-sm text-muted">{r.comment ?? noComment}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
