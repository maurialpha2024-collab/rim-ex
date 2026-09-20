"use client";

import { createContext, useContext, useMemo } from "react";
import { INTL_LOCALE, dirOf, type Locale } from "@/lib/i18n/config";
import { createT, type TFn } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";

type I18n = { locale: Locale; dir: "ltr" | "rtl"; intl: string; t: TFn };

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18n>(
    () => ({ locale, dir: dirOf(locale), intl: INTL_LOCALE[locale], t: createT(messages) }),
    [locale, messages]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
