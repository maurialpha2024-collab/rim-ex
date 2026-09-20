import type { profile as fr } from "../fr/profile";

export const profile: Record<keyof typeof fr, string> = {
  "profile.memberSince": "Member since {date}",
  "profile.newMember": "New member",
  "profile.sub.active": "Subscription active",
  "profile.sub.inactive": "Subscription inactive",
  "profile.suspended": "Account suspended",
  "profile.verifyCta": "Get verified",

  "profile.trust.title": "Trust",
  "profile.rating": "Average rating",
  "profile.ratingCount": "{n} reviews",
  "profile.completed": "Completed trades",
  "profile.completion30": "Completion (30 d)",
  "profile.release": "Average time",
  "profile.minutes": "{m} min",
  "profile.noData": "No data yet",

  "profile.checklist.title": "Verifications",
  "profile.check.whatsapp": "WhatsApp number",
  "profile.check.passport": "Passport",
  "profile.check.email": "Email address",
  "profile.check.subscription": "Subscription",
  "profile.check.provided": "Provided",
  "profile.check.missing": "Missing",
  "profile.check.confirmed": "Confirmed",
  "profile.check.unconfirmed": "Not confirmed",

  "profile.stats.title": "Activity",
  "profile.volume": "Volume traded",
  "profile.monthTrades": "Trades this month",
  "profile.positive": "Positive reviews",

  "profile.reviews.title": "Reviews received",
  "profile.reviews.bought": "MRU purchases",
  "profile.reviews.sold": "MRU sales",
  "profile.reviews.empty": "No reviews yet.",
  "profile.reviews.noComment": "No comment",

  "profile.history.title": "Trade history",
  "profile.history.empty": "No trades yet.",
};
