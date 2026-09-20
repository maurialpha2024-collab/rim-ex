"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut size={16} aria-hidden="true" className="rtl:-scale-x-100" />
      {t("common.signOut")}
    </Button>
  );
}
