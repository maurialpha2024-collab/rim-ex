"use client";

import { Check, Monitor, Moon, Sun, SunMoon, type LucideIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_COOKIE } from "@/lib/i18n/config";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; Icon: LucideIcon; label: "theme.light" | "theme.dark" | "theme.system" }[] = [
  { value: "light", Icon: Sun, label: "theme.light" },
  { value: "dark", Icon: Moon, label: "theme.dark" },
  { value: "system", Icon: Monitor, label: "theme.system" },
];

// "system" = no data-theme attribute, so the OS preference decides (see globals.css).
function readChoice(): Choice {
  const attr = document.documentElement.dataset.theme;
  return attr === "light" || attr === "dark" ? attr : "system";
}

function applyChoice(next: Choice) {
  const root = document.documentElement;
  if (next === "system") {
    delete root.dataset.theme;
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }
}

function ThemeItems() {
  const { t } = useI18n();
  // Only mounted while the menu is open, i.e. always on the client.
  const active = readChoice();
  return (
    <>
      {OPTIONS.map(({ value, Icon, label }) => (
        <DropdownMenuItem key={value} onSelect={() => applyChoice(value)}>
          <Icon size={16} aria-hidden="true" />
          <span className="flex-1">{t(label)}</span>
          {active === value && <Check size={16} aria-hidden="true" />}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("theme.label")} className="h-8 w-8">
          <SunMoon size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ThemeItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
