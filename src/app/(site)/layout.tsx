import NavBar, { buildNavItems } from "@/components/NavBar";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ profile }, { t }] = await Promise.all([getCurrentUser(), getI18n()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop"
      >
        {t("nav.skip")}
      </a>
      <NavBar profile={profile} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>
      <footer className="hidden border-t border-line px-4 py-6 text-center text-xs text-muted md:block">
        {t("footer.note")}
      </footer>
      {profile && <SiteNav items={buildNavItems(t, true)} label={t("nav.primary")} variant="bottom" />}
    </>
  );
}
