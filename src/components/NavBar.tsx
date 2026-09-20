import Link from "next/link";
import Logo from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteNav, type NavItem } from "@/components/SiteNav";
import { StatusPill, verificationKey } from "@/components/StatusPill";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import type { UserRow } from "@/lib/database.types";

// Server-built nav data, shared by the header links and the mobile tab bar.
export function buildNavItems(t: (key: MessageKey) => string, signedIn: boolean): NavItem[] {
  const items: NavItem[] = [{ href: "/", label: t("nav.market"), icon: "market", match: ["/"] }];
  if (signedIn) {
    items.push(
      { href: "/orders/new", label: t("nav.post"), icon: "post", match: ["/orders"] },
      { href: "/chat", label: t("nav.chat"), icon: "chat", match: ["/chat", "/trade"] },
      { href: "/profile", label: t("nav.profile"), icon: "profile", match: ["/profile", "/verify"] }
    );
  }
  return items;
}

export default async function NavBar({ profile }: { profile: UserRow | null }) {
  const { t } = await getI18n();
  const verification = profile ? verificationKey(profile.verification_status) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-control">
          <Logo size={36} alt="" />
          <span className="text-base font-semibold tracking-tight">{t("app.name")}</span>
          <Badge tone="primary" className="mono hidden sm:inline-flex">
            {t("app.pair")}
          </Badge>
        </Link>

        <SiteNav items={buildNavItems(t, !!profile)} label={t("nav.primary")} variant="top" />

        <div className="ms-auto flex items-center gap-1.5">
          {profile && verification && (
            <Link
              href={verification === "verified" ? "/profile" : "/verify"}
              className="hidden rounded-full sm:inline-flex"
            >
              <StatusPill status={verification} label={t(`status.${verification}` as MessageKey)} />
            </Link>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
          {!profile && (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{t("nav.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
