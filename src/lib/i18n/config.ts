export const LOCALES = ["fr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LANG_COOKIE = "lang";
export const THEME_COOKIE = "theme";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

// BCP-47 tags handed to Intl. Latin digits everywhere so amounts, ids and dates
// stay aligned in monospace columns even in Arabic.
export const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-MR-u-nu-latn",
};
