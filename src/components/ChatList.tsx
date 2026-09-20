"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { MoneyAmount } from "@/components/MoneyAmount";
import { StatusPill } from "@/components/StatusPill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TradeStatus } from "@/lib/database.types";
import { formatDate, formatRate, formatTime } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

export type ChatItem = {
  tradeId: string;
  name: string;
  /** Trade size in MRU (the anchor currency). */
  umAmount: number;
  /** MRU per 1 ₽. */
  rate: number;
  status: TradeStatus;
  lastAt: string;
  preview: string;
};

export function ChatList({ items }: { items: ChatItem[] }) {
  const { t, intl } = useI18n();
  const router = useRouter();

  // Re-fetch the list whenever a message arrives or a trade changes.
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };
    const channel = supabase
      .channel("chat-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, refresh)
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  function formatWhen(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return formatTime(iso, intl);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return t("chat.yesterday");
    return formatDate(iso, intl);
  }

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <MessagesSquare size={32} aria-hidden="true" className="text-muted" />
        <p className="font-semibold">{t("chatlist.empty")}</p>
        <Button asChild className="mt-2">
          <Link href="/">{t("chatlist.emptyCta")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-line">
        {items.map((c) => (
          <li key={c.tradeId}>
            <Link
              href={`/trade/${c.tradeId}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <Avatar name={c.name} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span suppressHydrationWarning className="shrink-0 text-xs text-muted">
                    {formatWhen(c.lastAt)}
                  </span>
                </div>
                <div className="truncate text-sm text-muted">{c.preview}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <MoneyAmount value={c.umAmount} currency="MRU" intl={intl} size="sm" className="text-fg" />
                  <span dir="ltr" className="mono">
                    {t("market.card.rate", { rate: formatRate(c.rate, intl) })}
                  </span>
                </div>
              </div>
              <StatusPill status={c.status} label={t(`status.${c.status}` as "status.locked" | "status.completed" | "status.cancelled")} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
