"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, PlusCircle, Store, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: "market" | "post" | "chat" | "profile";
  /** Path prefixes that count as "inside" this item (the market is matched exactly). */
  match: string[];
};

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  market: Store,
  post: PlusCircle,
  chat: MessageCircle,
  profile: UserRound,
};

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.href === "/" ? pathname === "/" : item.match.some((prefix) => pathname.startsWith(prefix));
}

// variant="top": desktop links in the header. variant="bottom": mobile tab bar.
export function SiteNav({ items, label, variant }: { items: NavItem[]; label: string; variant: "top" | "bottom" }) {
  const isActive = useIsActive();

  if (variant === "top") {
    return (
      <nav aria-label={label} className="hidden items-center gap-1 md:flex">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand" : "text-muted"
                )}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
