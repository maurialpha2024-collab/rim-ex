import { cookies } from "next/headers";
import { DEFAULT_LOCALE, INTL_LOCALE, LANG_COOKIE, THEME_COOKIE, dirOf, isLocale, type Locale } from "./config";
import { createT } from "./index";
import { MESSAGES } from "./messages";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getTheme(): Promise<"light" | "dark" | undefined> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" ? value : undefined;
}

// Everything a server component needs to render in the visitor's language.
export async function getI18n() {
  const locale = await getLocale();
  const messages = MESSAGES[locale];
  return { locale, dir: dirOf(locale), intl: INTL_LOCALE[locale], messages, t: createT(messages) };
}
