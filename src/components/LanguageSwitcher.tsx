"use client";

import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANG_COOKIE, LOCALES, type Locale } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";

function writeLangCookie(next: Locale) {
  document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();

  function choose(next: Locale) {
    writeLangCookie(next);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("lang.label")} className="gap-1.5">
          <Languages size={16} aria-hidden="true" />
          <span className="hidden uppercase sm:inline">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {LOCALES.map((code) => (
          <DropdownMenuItem key={code} onSelect={() => choose(code)} lang={code}>
            <span className="flex-1">{t(`lang.${code}` as MessageKey)}</span>
            {code === locale && <Check size={16} aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
