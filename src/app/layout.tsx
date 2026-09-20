import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n, getTheme } from "@/lib/i18n/server";
import "./globals.css";

// One family covers Arabic and Latin so both scripts share the same weight and rhythm.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Tabular figures for every amount, rate and timestamp.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

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
      className={`${plexArabic.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
