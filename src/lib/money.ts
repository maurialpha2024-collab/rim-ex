// Central money formatting. MRU is shown as whole numbers with a "MRU" suffix,
// RUB with two decimals and a "₽" suffix. Separators follow the UI locale (CLDR).
export type Currency = "MRU" | "RUB";

const SUFFIX: Record<Currency, string> = { MRU: "MRU", RUB: "₽" };

export function formatMoney(value: number, currency: Currency, intl: string) {
  const digits = currency === "MRU" ? 0 : 2;
  const number = new Intl.NumberFormat(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  return `${number} ${SUFFIX[currency]}`;
}

// A rate is stored as MRU per 1 ₽ (see the spec). Up to 4 decimals, trailing zeros trimmed.
export function formatRate(value: number, intl: string) {
  return new Intl.NumberFormat(intl, { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
}

export function formatPercent(value: number, intl: string) {
  return new Intl.NumberFormat(intl, { style: "percent", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string, intl: string) {
  return new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function formatTime(iso: string, intl: string) {
  return new Intl.DateTimeFormat(intl, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDateTime(iso: string, intl: string) {
  return new Intl.DateTimeFormat(intl, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// An order stores `amount` in the currency its poster HAS, and `rate` as MRU per 1 ₽.
// Returns what the poster gives and what they want in return.
export function orderLegs(type: "sell_um_for_ruble" | "sell_ruble_for_um", amount: number, rate: number) {
  if (type === "sell_um_for_ruble") {
    return { give: { currency: "MRU" as const, value: amount }, want: { currency: "RUB" as const, value: rate ? amount / rate : 0 } };
  }
  return { give: { currency: "RUB" as const, value: amount }, want: { currency: "MRU" as const, value: amount * rate } };
}
