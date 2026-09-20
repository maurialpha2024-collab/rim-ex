import type { order as fr } from "../fr/order";

export const order: Record<keyof typeof fr, string> = {
  "order.title": "Post an ad",
  "order.subtitle": "Set your rate: you're matched as soon as someone accepts.",
  "order.back": "Market",
  "order.steps": "Steps",
  "order.step.direction": "Direction",
  "order.step.rate": "Rate",
  "order.step.amount": "Amount",
  "order.step.review": "Summary",

  "order.dir.title": "What do you want to do?",
  "order.dir.sellUm": "I sell MRU",
  "order.dir.sellUmHint": "I receive ₽",
  "order.dir.sellRub": "I sell ₽",
  "order.dir.sellRubHint": "I receive MRU",

  "order.rate.label": "Your rate (MRU per 1 ₽)",
  "order.rate.hint": "Example: 5 means 1 ₽ = 5 MRU.",
  "order.rate.error": "Enter a rate greater than 0.",

  "order.amount.label": "Amount to sell ({currency})",
  "order.amount.hint": "The amount is fixed: the ad is traded in one go.",
  "order.amount.error": "Enter an amount greater than 0.",
  "order.estimate": "You'll receive ≈",

  "order.review.title": "Review your ad",
  "order.review.give": "You sell",
  "order.review.get": "You receive ≈",
  "order.review.rate": "Rate",
  "order.review.note":
    "Once the ad is accepted you have 30 minutes to complete the trade. You pay and confirm directly with the other person: RIM-EX never touches the money.",

  "order.publish": "Publish the ad",
  "order.publishing": "Publishing…",
  "order.preview.title": "Preview",
  "order.preview.hint": "This is how your ad will appear in the market.",
  "order.login": "Log in to post",
};
