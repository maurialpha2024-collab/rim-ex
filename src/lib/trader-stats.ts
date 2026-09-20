import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type TraderStats = {
  /** Trades opened in the last 30 days (any outcome). */
  trades30d: number;
  /** completed / (completed + cancelled) over the last 30 days, or null with no closed trades. */
  completionRate: number | null;
  /** Average minutes between a trade locking and completing, or null with no completed trades. */
  avgReleaseMin: number | null;
};

type TradeSlice = {
  buyer_id: string;
  seller_id: string;
  status: "locked" | "completed" | "cancelled";
  locked_at: string;
  completed_at: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Derived from the trades table (no extra schema needed). Trades are private to their two
// participants under RLS, so this reads with the service role — on the server only, and it
// returns aggregates, never individual trades.
export async function getTraderStats(userIds: string[]): Promise<Map<string, TraderStats>> {
  const ids = [...new Set(userIds)];
  const result = new Map<string, TraderStats>();
  if (ids.length === 0) return result;

  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const list = ids.join(",");
  const { data } = await createAdminClient()
    .from("trades")
    .select("buyer_id, seller_id, status, locked_at, completed_at")
    .gte("locked_at", since)
    .or(`buyer_id.in.(${list}),seller_id.in.(${list})`);

  const acc = new Map<string, { total: number; done: number; cancelled: number; minutes: number[] }>();
  for (const id of ids) acc.set(id, { total: 0, done: 0, cancelled: 0, minutes: [] });

  for (const trade of (data ?? []) as TradeSlice[]) {
    for (const id of [trade.buyer_id, trade.seller_id]) {
      const bucket = acc.get(id);
      if (!bucket) continue;
      bucket.total += 1;
      if (trade.status === "completed") {
        bucket.done += 1;
        if (trade.completed_at) {
          bucket.minutes.push((new Date(trade.completed_at).getTime() - new Date(trade.locked_at).getTime()) / 60000);
        }
      } else if (trade.status === "cancelled") {
        bucket.cancelled += 1;
      }
    }
  }

  for (const [id, b] of acc) {
    const closed = b.done + b.cancelled;
    result.set(id, {
      trades30d: b.total,
      completionRate: closed ? b.done / closed : null,
      avgReleaseMin: b.minutes.length ? b.minutes.reduce((a, m) => a + m, 0) / b.minutes.length : null,
    });
  }
  return result;
}
