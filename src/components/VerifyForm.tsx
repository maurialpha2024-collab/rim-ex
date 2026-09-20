"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ImagePlus, X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { PassportExample } from "@/components/PassportExample";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages";
import { analyzePhoto, type PhotoWarnings } from "@/lib/photo-check";
import { createClient } from "@/lib/supabase/client";

const COUNTRY_CODES = ["222", "7", "212", "221", "223", "33"] as const;

// "new": WhatsApp -> passport photo -> consent. "resubmit" (after a rejection): the original
// photo is kept on file (it is write-once), so only WhatsApp + consent are asked again.
export function VerifyForm({
  userId,
  mode,
  initialWhatsapp,
}: {
  userId: string;
  mode: "new" | "resubmit";
  initialWhatsapp: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const keys = mode === "new" ? (["whatsapp", "photo", "review"] as const) : (["whatsapp", "review"] as const);
  const [step, setStep] = useState(0);
  const current = keys[step];

  // Pre-fill from an existing number like "+22236123456" (longest matching country code wins).
  const knownCc = [...COUNTRY_CODES].sort((a, b) => b.length - a.length).find((c) => initialWhatsapp.startsWith(`+${c}`));
  const [cc, setCc] = useState<string>(knownCc ?? "222");
  const [number, setNumber] = useState(knownCc ? initialWhatsapp.slice(knownCc.length + 1) : initialWhatsapp.replace(/\D/g, ""));
  const [file, setFile] = useState<File | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [warnings, setWarnings] = useState<PhotoWarnings | null>(null);
  const [dragging, setDragging] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = number.replace(/\D/g, "").replace(/^0+/, "");
  const numberOk = digits.length >= 6 && digits.length <= 12;
  const whatsapp = `+${cc}${digits}`;

  // Live thumbnail (the object URL is released when the file changes or the form unmounts).
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function pick(next: File | null | undefined) {
    if (!next || !next.type.startsWith("image/")) return;
    setPreviewFailed(false);
    setFile(next);
    setWarnings(await analyzePhoto(next));
  }

  function clearFile() {
    setFile(null);
    setWarnings(null);
  }

  function next() {
    const ok = current === "whatsapp" ? numberOk : current === "photo" ? !!file : true;
    if (!ok) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!consent) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const path = `${userId}/passport`;

    if (mode === "new" && file) {
      const { error: uploadError } = await supabase.storage
        .from("passport-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      // The photo is write-once: "already exists" means an earlier attempt got this far, so carry on.
      if (uploadError && !uploadError.message.includes("already exists")) {
        setSubmitting(false);
        setError(t("verify.err.upload"));
        return;
      }
    }

    const { error: rpcError } = await supabase.rpc("submit_verification", { p_whatsapp: whatsapp, p_photo_path: path });
    if (rpcError) {
      setSubmitting(false);
      setError(t("verify.err.rpc"));
      return;
    }
    router.refresh();
  }

  const warningKeys: MessageKey[] = warnings
    ? [
        ...(warnings.blur ? (["verify.photo.warn.blur"] as const) : []),
        ...(warnings.glare ? (["verify.photo.warn.glare"] as const) : []),
        ...(warnings.small ? (["verify.photo.warn.small"] as const) : []),
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <ol aria-label={t("verify.steps")} className="flex items-center gap-2">
        {keys.map((key, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={key} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done || active ? "bg-primary text-on-primary" : "bg-surface-2 text-muted"
                )}
              >
                {done ? <Check size={14} aria-hidden="true" /> : <bdi className="mono">{i + 1}</bdi>}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-fg" : "text-muted")}>{t(`verify.step.${key}` as MessageKey)}</span>
              {i < keys.length - 1 && <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-line")} />}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          {current === "whatsapp" && (
            <>
              <div>
                <h2 className="text-lg font-semibold">{t("verify.whatsapp.title")}</h2>
                <p className="mt-1 text-sm text-muted">{t("verify.whatsapp.hint")}</p>
              </div>
              <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-3">
                <Field htmlFor="cc" label={t("verify.whatsapp.country")}>
                  <Select id="cc" value={cc} onChange={(e) => setCc(e.target.value)}>
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {t(`verify.cc.${code}` as MessageKey)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  htmlFor="wa"
                  label={t("verify.whatsapp.number")}
                  error={touched && !numberOk ? t("verify.whatsapp.error") : undefined}
                >
                  <Input
                    id="wa"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    dir="ltr"
                    autoFocus
                    aria-invalid={touched && !numberOk}
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="36 12 34 56"
                    className="mono text-start"
                  />
                </Field>
              </div>
            </>
          )}

          {current === "photo" && (
            <>
              <div>
                <h2 className="text-lg font-semibold">{t("verify.photo.title")}</h2>
                <p className="mt-1 text-sm text-muted">{t("verify.photo.hint")}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
                <div className="flex flex-col gap-3">
                  {file ? (
                    <div className="flex items-center gap-3 rounded-control border border-line p-3">
                      {previewUrl && !previewFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={t("verify.photo.preview")}
                          onError={() => setPreviewFailed(true)}
                          className="h-24 w-32 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex h-24 w-32 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                          <ImagePlus size={24} aria-hidden="true" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium" dir="ltr">
                          {file.name}
                        </div>
                        <div className="mono text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                        <div className="mt-2 flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <label htmlFor="passport" className="cursor-pointer">
                              {t("verify.photo.change")}
                            </label>
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={clearFile}>
                            <X size={14} aria-hidden="true" />
                            {t("verify.photo.remove")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="passport"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        pick(e.dataTransfer.files?.[0]);
                      }}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-4 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/40",
                        dragging ? "border-primary bg-primary-soft" : "border-line-strong hover:bg-surface-2",
                        touched && !file && "border-negative"
                      )}
                    >
                      <ImagePlus size={28} aria-hidden="true" className="text-muted" />
                      <span className="text-sm font-medium">{t("verify.photo.drop")}</span>
                      <span className="text-xs text-muted">{t("verify.photo.formats")}</span>
                    </label>
                  )}
                  <input
                    id="passport"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      pick(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  {touched && !file && (
                    <p role="alert" className="text-xs text-negative-ink">
                      {t("verify.photo.error")}
                    </p>
                  )}
                  {warningKeys.map((key) => (
                    <p key={key} role="status" className="flex items-start gap-2 rounded-control bg-warning-soft px-3 py-2 text-xs text-warning-ink">
                      <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                      {t(key)}
                    </p>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-muted">{t("verify.photo.example")}</div>
                  <PassportExample label={t("verify.photo.example")} />
                  <ul className="flex flex-col gap-1 text-xs text-muted">
                    {(["verify.photo.tip1", "verify.photo.tip2", "verify.photo.tip3"] as const).map((key) => (
                      <li key={key} className="flex items-center gap-1.5">
                        <Check size={12} aria-hidden="true" className="text-positive" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {current === "review" && (
            <>
              <h2 className="text-lg font-semibold">{t("verify.review.title")}</h2>
              <dl className="divide-y divide-line rounded-control border border-line text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{t("verify.review.whatsapp")}</dt>
                  <dd dir="ltr" className="mono font-medium">
                    {whatsapp}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{t("verify.review.photo")}</dt>
                  <dd className="font-medium">{file ? file.name : t("verify.review.photoKept")}</dd>
                </div>
              </dl>

              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="text-sm">
                  {t("verify.consent")}
                  <span className="mt-1 block text-xs text-muted">{t("verify.consent.note")}</span>
                </span>
              </label>
              {touched && !consent && (
                <p role="alert" className="-mt-2 text-xs text-negative-ink">
                  {t("verify.consent.error")}
                </p>
              )}
              {error && (
                <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
                  {error}
                </p>
              )}
            </>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
              {t("common.back")}
            </Button>
            {current !== "review" ? (
              <Button onClick={next}>{t("common.next")}</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? t("verify.submitting") : t("verify.submit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
