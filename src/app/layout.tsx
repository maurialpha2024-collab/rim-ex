import type { Metadata } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n, getTheme } from "@/lib/i18n/server";
import "./fonts.css";
import "./globals.css";

// Fonts are self-hosted (see fonts.css): IBM Plex Sans Arabic covers Arabic and Latin so both scripts share the
// same weight and rhythm, JetBrains Mono gives tabular figures for every amount, rate and timestamp.

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: "RIM-EX | MRU ⇄ ₽",
    description: t("app.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ locale, dir, messages }, theme] = await Promise.all([getI18n(), getTheme()]);

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={theme}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
