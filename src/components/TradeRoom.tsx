"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { ChatThread } from "@/components/ChatThread";
import { useI18n } from "@/components/I18nProvider";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RatingCard } from "@/components/RatingCard";
import { StatusPill } from "@/components/StatusPill";
import { TradePanel } from "@/components/TradePanel";
import { TrustBadge } from "@/components/TrustBadge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type {
  CancelReason,
  ChatMessageRow,
  ChatMessageType,
  OrderType,
  RatingRow,
  TradeRow,
  UserRow,
} from "@/lib/database.types";
import { orderLegs } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

const LOCK_MS = 30 * 60 * 1000;

type Counterparty = Pick<
  UserRow,
  "display_name" | "avg_rating" | "completed_trades_count" | "verification_status"
>;

export function TradeRoom({
  trade,
  orderType,
  orderUserId,
  myId,
  counterparty,
  initialMessages,
  initialRatings,
}: {
  trade: TradeRow;
  orderType: OrderType;
  /** Who posted the ad (their ad is closed, not re-opened, if they cancel). */
  orderUserId: string;
  myId: string;
  counterparty: Counterparty | null;
  initialMessages: ChatMessageRow[];
  initialRatings: RatingRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [tradeState, setTradeState] = useState(trade);
  const [messages, setMessages] = useState(initialMessages);
  const [ratings, setRatings] = useState(initialRatings);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const iAmBuyer = myId === trade.buyer_id;
  const iConfirmed = iAmBuyer ? tradeState.buyer_confirmed : tradeState.seller_confirmed;
  const theyConfirmed = iAmBuyer ? tradeState.seller_confirmed : tradeState.buyer_confirmed;
  const locked = tradeState.status === "locked";
  // Chat stays open after payment is confirmed; only a released (cancelled) trade is read-only.
  const canSend = tradeState.status !== "cancelled";
  const counterpartyId = iAmBuyer ? trade.seller_id : trade.buyer_id;
  const name = counterparty?.display_name ?? t("trade.defaultName");
  // Who ended a cancelled trade: me, them, or nobody (it timed out).
  const cancelledBy: "me" | "them" | "expired" =
    tradeState.cancelled_by === myId ? "me" : tradeState.cancelled_by ? "them" : "expired";
  const myRating = ratings.find((r) => r.rated_by === myId) ?? null;
  const theirRating = ratings.find((r) => r.rated_by === counterpartyId) ?? null;

  // The buyer pays MRU and receives ₽; the seller pays ₽ and receives MRU (see accept_order).
  const { give, want } = orderLegs(orderType, tradeState.amount, tradeState.rate);
  const um = give.currency === "MRU" ? give : want;
  const rub = give.currency === "RUB" ? give : want;
  const send = iAmBuyer ? um : rub;
  const receive = iAmBuyer ? rub : um;

  function addMessage(incoming: ChatMessageRow) {
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
  }
  function addRating(incoming: RatingRow) {
    setRatings((prev) => (prev.some((r) => r.id === incoming.id) ? prev : [...prev, incoming]));
  }

  useEffect(() => {
    const channel = supabase
      .channel(`trade-${trade.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `trade_id=eq.${trade.id}` },
        (payload) => addMessage(payload.new as ChatMessageRow)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trades", filter: `id=eq.${trade.id}` },
        (payload) => setTradeState(payload.new as TradeRow)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ratings", filter: `trade_id=eq.${trade.id}` },
        (payload) => addRating(payload.new as RatingRow)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, trade.id]);

  function readable(err: unknown) {
    const msg = (err as { message?: string } | null)?.message ?? "";
    return msg.includes("row-level security") ? t("chat.closed") : msg || t("chat.sendFailed");
  }

  async function post(row: { message_type: ChatMessageType; message?: string; attachment_path?: string }) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ trade_id: trade.id, sender_id: myId, ...row })
      .select()
      .single();
    if (error) throw error;
    addMessage(data as ChatMessageRow);
  }

  async function sendText(text: string) {
    setChatError(null);
    try {
      await post({ message_type: "text", message: text });
      return true;
    } catch (err) {
      setChatError(readable(err));
      return false;
    }
  }

  async function sendAttachment(kind: "image" | "audio", body: Blob, ext: string, contentType: string) {
    setUploading(true);
    setChatError(null);
    const path = `${trade.id}/${myId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("trade-attachments").upload(path, body, { contentType });
    if (uploadError) {
      setChatError(readable(uploadError));
    } else {
      try {
        await post({ message_type: kind, attachment_path: path });
      } catch (err) {
        setChatError(readable(err));
      }
    }
    setUploading(false);
  }

  async function confirm() {
    setConfirming(true);
    setConfirmError(null);
    const { data, error } = await supabase.rpc("confirm_trade", { p_trade_id: trade.id });
    if (error) setConfirmError(t("common.error"));
    else if (data) setTradeState(data as TradeRow);
    setConfirming(false);
  }

  // Returns true when the trade was cancelled (the panel then closes its dialog).
  async function cancelTrade(reason: CancelReason) {
    setCancelling(true);
    setCancelError(null);
    const { data, error } = await supabase.rpc("cancel_trade", { p_trade_id: trade.id, p_reason: reason });
    setCancelling(false);
    if (error) {
      // PGRST202 = the function doesn't exist yet (migration 0008 not run).
      const missing = error.code === "PGRST202" || error.message.includes("Could not find the function");
      setCancelError(
        error.message.includes("already confirmed")
          ? t("trade.cancel.locked")
          : missing
            ? t("trade.cancel.unavailable")
            : t("trade.cancel.err")
      );
      return false;
    }
    if (data) setTradeState(data as TradeRow);
    return true;
  }

  // Returns an error message, or null on success.
  async function submitRating(stars: number, comment: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("ratings")
      .insert({ trade_id: trade.id, rated_by: myId, rated_user: counterpartyId, stars, comment: comment || null })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") return t("rate.errDup");
      if (error.message.includes("row-level security")) return t("rate.errClosed");
      return t("common.error");
    }
    addRating(data as RatingRow);
    router.refresh(); // update the counterparty's average in the header
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: who, which trade, how long is left */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/chat"
            aria-label={t("trade.back")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft size={18} aria-hidden="true" className="rtl:-scale-x-100" />
          </Link>
          <Avatar name={counterparty?.display_name} size={44} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold">{name}</span>
              <TrustBadge
                verified={counterparty?.verification_status === "verified"}
                verifiedLabel={t("badge.verified")}
                newLabel={t("badge.new")}
              />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Star size={13} aria-hidden="true" className="fill-gold text-gold" />
                <bdi className="mono">
                  {(counterparty?.completed_trades_count ?? 0) > 0 ? Number(counterparty?.avg_rating ?? 0).toFixed(1) : "—"}
                </bdi>
              </span>
              <span>{t("trade.trades", { n: counterparty?.completed_trades_count ?? 0 })}</span>
              <span className="mono">{t("trade.order", { id: trade.id.slice(0, 8).toUpperCase() })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
          <StatusPill
            status={tradeState.status}
            label={t(`status.${tradeState.status}` as "status.locked" | "status.completed" | "status.cancelled")}
          />
          {locked && (
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-muted">{t("trade.autoRelease")}</span>
              <CountdownTimer deadline={new Date(trade.locked_at).getTime() + LOCK_MS} size="xl" />
            </div>
          )}
        </div>
      </Card>

      {/* Payment/status on one side, chat on the other (mirrored in RTL by the grid) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <TradePanel
          status={tradeState.status}
          iConfirmed={iConfirmed}
          theyConfirmed={theyConfirmed}
          counterpartyName={name}
          send={send}
          receive={receive}
          rate={tradeState.rate}
          onConfirm={confirm}
          confirming={confirming}
          confirmError={confirmError}
          iAmPoster={myId === orderUserId}
          cancelledBy={cancelledBy}
          cancelReason={tradeState.cancel_reason ?? null}
          onCancel={cancelTrade}
          cancelling={cancelling}
          cancelError={cancelError}
          rating={
            <RatingCard name={name} myRating={myRating} theirRating={theirRating} onSubmit={submitRating} />
          }
        />
        <ChatThread
          messages={messages}
          myId={myId}
          canSend={canSend}
          uploading={uploading}
          error={chatError}
          onSendText={sendText}
          onSendPhoto={(file) => sendAttachment("image", file, file.name.split(".").pop() ?? "jpg", file.type)}
          onSendAudio={(blob, mime) =>
            sendAttachment("audio", blob, mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm", mime)
          }
          className="h-[70dvh] min-h-[28rem] lg:sticky lg:top-20 lg:h-[calc(100dvh-17rem)]"
        />
      </div>
    </div>
  );
}
