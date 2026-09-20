import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Clock, ShieldX } from "lucide-react";
import { StatusPill, verificationKey } from "@/components/StatusPill";
import { VerifyForm } from "@/components/VerifyForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import { formatDateTime } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const [{ authId, profile }, { t, intl }] = await Promise.all([getCurrentUser(), getI18n()]);
  if (!authId || !profile) redirect("/login");

  const status = profile.verification_status;
  const key = verificationKey(status);

  // When the passport photo was uploaded = when the review request was submitted.
  let submittedAt: string | null = null;
  if (status === "pending_verification") {
    const { data: files } = await (await createClient()).storage.from("passport-photos").list(authId);
    submittedAt = files?.[0]?.created_at ?? null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("verify.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("verify.subtitle")}</p>
        </div>
        <StatusPill status={key} label={t(`status.${key}` as MessageKey)} />
      </div>

      {status === "verified" && (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive-ink">
              <BadgeCheck size={26} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{t("verify.verified.title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("verify.verified.body")}</p>
            </div>
            <Button asChild>
              <Link href="/">{t("verify.verified.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "pending_verification" && (
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-ink">
                <Clock size={26} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{t("verify.pending.title")}</h2>
                <p className="mt-1 text-sm text-muted">{t("verify.pending.body")}</p>
              </div>
            </div>
            <dl className="divide-y divide-line rounded-control border border-line text-sm">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-muted">{t("verify.pending.ref")}</dt>
                <dd className="mono font-medium">VER-{authId.slice(0, 8).toUpperCase()}</dd>
              </div>
              {submittedAt && (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{t("verify.pending.submitted")}</dt>
                  <dd className="font-medium">{formatDateTime(submittedAt, intl)}</dd>
                </div>
              )}
              {profile.whatsapp_number && (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{t("verify.pending.whatsapp")}</dt>
                  <dd dir="ltr" className="mono font-medium">
                    {profile.whatsapp_number}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {status === "rejected" && (
        <>
          <Card className="border-negative/40">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-negative-soft text-negative-ink">
                  <ShieldX size={26} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{t("verify.rejected.title")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("verify.rejected.resubmit")}</p>
                </div>
              </div>
              <div className="rounded-control bg-negative-soft px-4 py-3 text-sm text-negative-ink">
                <span className="font-semibold">{t("verify.rejected.reason")} : </span>
                {profile.rejection_reason ?? t("verify.rejected.noReason")}
              </div>
            </CardContent>
          </Card>
          <VerifyForm userId={authId} mode="resubmit" initialWhatsapp={profile.whatsapp_number ?? ""} />
        </>
      )}

      {status === "unverified" && (
        <VerifyForm userId={authId} mode="new" initialWhatsapp={profile.whatsapp_number ?? ""} />
      )}
    </div>
  );
}
