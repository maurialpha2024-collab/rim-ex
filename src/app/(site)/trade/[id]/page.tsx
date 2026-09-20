import { notFound } from "next/navigation";
import { TradeRoom } from "@/components/TradeRoom";
import { getCurrentUser } from "@/lib/auth";
import type { ChatMessageRow, OrderRow, RatingRow, TradeRow, UserRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { authId } = await getCurrentUser();

  const { data: trade } = await supabase.from("trades").select("*").eq("id", id).maybeSingle<TradeRow>();

  if (!trade || !authId || (trade.buyer_id !== authId && trade.seller_id !== authId)) {
    notFound();
  }

  const counterpartyId = trade.buyer_id === authId ? trade.seller_id : trade.buyer_id;
  const [{ data: order }, { data: counterparty }, { data: messages }, { data: ratings }] = await Promise.all([
    supabase.from("orders").select("type, user_id").eq("id", trade.order_id).single<Pick<OrderRow, "type" | "user_id">>(),
    supabase
      .from("users")
      .select("display_name, avg_rating, completed_trades_count, verification_status")
      .eq("id", counterpartyId)
      .single<Pick<UserRow, "display_name" | "avg_rating" | "completed_trades_count" | "verification_status">>(),
    supabase.from("chat_messages").select("*").eq("trade_id", id).order("created_at", { ascending: true }),
    supabase.from("ratings").select("*").eq("trade_id", id),
  ]);

  if (!order) notFound();

  return (
    <TradeRoom
      trade={trade}
      orderType={order.type}
      orderUserId={order.user_id}
      myId={authId}
      counterparty={counterparty ?? null}
      initialMessages={(messages ?? []) as ChatMessageRow[]}
      initialRatings={(ratings ?? []) as RatingRow[]}
    />
  );
}
