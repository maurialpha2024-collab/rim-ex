import Link from "next/link";
import { ChatList, type ChatItem } from "@/components/ChatList";
import { getCurrentUser } from "@/lib/auth";
import type { ChatMessageRow, OrderRow, TradeRow, UserRow } from "@/lib/database.types";
import { getI18n } from "@/lib/i18n/server";
import { orderLegs } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const [{ authId }, { t }] = await Promise.all([getCurrentUser(), getI18n()]);
  if (!authId) {
    return (
      <p className="text-sm text-muted">
        <Link href="/login" className="font-medium text-brand underline underline-offset-2">
          {t("nav.login")}
        </Link>{" "}
        · {t("chatlist.login")}
      </p>
    );
  }

  const supabase = await createClient();
  const { data: tradeData } = await supabase
    .from("trades")
    .select("*")
    .or(`buyer_id.eq.${authId},seller_id.eq.${authId}`)
    .order("locked_at", { ascending: false })
    .limit(50);
  const trades = (tradeData ?? []) as TradeRow[];

  const otherIds = [...new Set(trades.map((tr) => (tr.buyer_id === authId ? tr.seller_id : tr.buyer_id)))];
  const orderIds = [...new Set(trades.map((tr) => tr.order_id))];

  const [{ data: userData }, { data: orderData }, lastMessages] = await Promise.all([
    otherIds.length
      ? supabase.from("users").select("id, display_name").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    orderIds.length
      ? supabase.from("orders").select("id, type").in("id", orderIds)
      : Promise.resolve({ data: [] }),
    // One "latest message" query per trade, so a busy chat can't hide the others.
    Promise.all(
      trades.map(async (tr) => {
        const { data } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("trade_id", tr.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return ((data ?? [])[0] ?? null) as ChatMessageRow | null;
      })
    ),
  ]);

  const names = new Map(
    ((userData ?? []) as Pick<UserRow, "id" | "display_name">[]).map((u) => [u.id, u.display_name])
  );
  const types = new Map(((orderData ?? []) as Pick<OrderRow, "id" | "type">[]).map((o) => [o.id, o.type]));

  function preview(m: ChatMessageRow | null) {
    if (!m) return t("chatlist.noMessages");
    const prefix = m.sender_id === authId ? t("chatlist.you") : "";
    if (m.message_type === "image") return `${prefix}${t("chatlist.photo")}`;
    if (m.message_type === "audio") return `${prefix}${t("chatlist.voice")}`;
    return `${prefix}${m.message ?? ""}`;
  }

  const items: ChatItem[] = trades
    .map((tr, i) => {
      const last = lastMessages[i];
      const otherId = tr.buyer_id === authId ? tr.seller_id : tr.buyer_id;
      const { give, want } = orderLegs(types.get(tr.order_id) ?? "sell_um_for_ruble", tr.amount, tr.rate);
      return {
        tradeId: tr.id,
        name: names.get(otherId) ?? t("trade.defaultName"),
        umAmount: give.currency === "MRU" ? give.value : want.value,
        rate: tr.rate,
        status: tr.status,
        lastAt: last?.created_at ?? tr.locked_at,
        preview: preview(last),
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("chatlist.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("chatlist.count", { n: items.length })}</p>
      </div>
      <ChatList items={items} />
    </div>
  );
}
