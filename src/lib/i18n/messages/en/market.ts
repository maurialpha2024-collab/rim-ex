import type { market as fr } from "../fr/market";

export const market: Record<keyof typeof fr, string> = {
  "market.title": "P2P market",
  "market.subtitle": "{count} open ads",
  "market.currencies": "MRU = Mauritanian ouguiya · ₽ = Russian ruble",
  "market.side.label": "Direction of the exchange",
  "market.side.buy": "Buy MRU",
  "market.side.sell": "Sell MRU",
  "market.side.buyHint": "You pay in ₽ and receive MRU",
  "market.side.sellHint": "You pay in MRU and receive ₽",

  "market.filter.min": "Min. amount ({currency})",
  "market.filter.sort": "Sort by",
  "market.filter.apply": "Filter",
  "market.filter.reset": "Reset",
  "market.sort.price": "Best price",
  "market.sort.new": "Newest",
  "market.sort.size": "Largest amount",

  "market.card.rate": "1 ₽ = {rate} MRU",
  "market.card.rateLabel": "Price",
  "market.card.receive": "You receive",
  "market.card.pay": "You pay ≈",
  "market.card.fixed": "Fixed amount: the ad is traded in one go.",
  "market.card.trades30": "{n} trades · 30 d",
  "market.card.completion": "{p} completion",
  "market.card.release": "≈ {m} min on average",
  "market.card.noStats": "No stats yet",
  "market.card.anonymous": "Anonymous",

  "market.action.buy": "Buy MRU",
  "market.action.sell": "Sell MRU",
  "market.action.own": "Your ad",

  "market.gate.guest": "Log in to trade",
  "market.gate.unverified": "Get verified to trade",
  "market.gate.pending": "Verification pending",
  "market.gate.rejected": "Verification rejected",
  "market.gate.no_subscription": "Subscription required",
  "market.gate.suspended": "Account suspended",

  "market.banner.guest": "Browse the market freely. Log in and get verified to trade.",
  "market.banner.unverified": "Send your passport and WhatsApp number to post or accept ads.",
  "market.banner.pending": "Your file is under review. You can trade as soon as it is approved.",
  "market.banner.rejected": "Your verification was rejected. Check the reason and resubmit your file.",
  "market.banner.no_subscription":
    "You are verified, but your subscription is not active yet. An admin needs to activate it.",
  "market.banner.suspended": "Your account is suspended. Please contact support.",
  "market.banner.cta.guest": "Log in",
  "market.banner.cta.unverified": "Get verified",
  "market.banner.cta.pending": "See status",
  "market.banner.cta.rejected": "See the reason",

  "market.confirm.title": "Start this trade?",
  "market.confirm.body":
    "The ad is locked for you for 30 minutes and you chat with {name}. If both sides don't confirm, it goes back on the market.",
  "market.confirm.cta": "Start the trade",
  "market.locking": "Locking…",

  "market.err.notEligible": "You must be verified and subscribed to trade.",
  "market.err.unavailable": "This ad is no longer available.",
  "market.err.own": "You can't accept your own ad.",

  "market.empty.title": "No ads right now",
  "market.empty.hint": "Post yours or change the filters.",
  "market.empty.cta": "Post an ad",
};
