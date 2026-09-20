import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/database.types";

// Cached per request: the header, layout and page can all ask without repeating the round-trips.
export const getCurrentUser = cache(async (): Promise<{
  authId: string | null;
  profile: UserRow | null;
}> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authId: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { authId: user.id, profile: profile ?? null };
});

export function canTrade(profile: UserRow | null): boolean {
  if (!profile) return false;
  return (
    profile.verification_status === "verified" &&
    profile.subscription_status === "active" &&
    !profile.is_suspended
  );
}

// Why a visitor can or can't trade. Drives the visible "Verify to trade" states
// (a gated action is never hidden silently).
export type TradeGate =
  | "guest"
  | "unverified"
  | "pending"
  | "rejected"
  | "no_subscription"
  | "suspended"
  | "ready";

export function tradeGate(profile: UserRow | null): TradeGate {
  if (!profile) return "guest";
  if (profile.is_suspended) return "suspended";
  switch (profile.verification_status) {
    case "unverified":
      return "unverified";
    case "pending_verification":
      return "pending";
    case "rejected":
      return "rejected";
  }
  return profile.subscription_status === "active" ? "ready" : "no_subscription";
}
