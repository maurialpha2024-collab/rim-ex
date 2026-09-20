"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message.includes("already registered") ? t("auth.err.taken") : signUpError.message);
      return;
    }
    if (data.user) {
      await supabase.from("users").update({ phone }).eq("id", data.user.id);
    }
    setLoading(false);
    setDone(true);
  }

  const strength = passwordStrength(password);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 py-4 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-12">
      {/* Pitch */}
      <div className="hidden flex-col gap-6 lg:flex">
        <div>
          <Badge tone="primary">{t("auth.pitch.badge")}</Badge>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">{t("auth.pitch.title")}</h1>
          <p className="mt-3 max-w-lg text-muted">{t("auth.pitch.body")}</p>
        </div>
        <ul className="flex flex-col gap-4">
          {(
            [
              ["auth.pitch.f1.title", "auth.pitch.f1.desc"],
              ["auth.pitch.f2.title", "auth.pitch.f2.desc"],
              ["auth.pitch.f3.title", "auth.pitch.f3.desc"],
            ] as const
          ).map(([title, desc]) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Check size={14} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{t(title)}</span>
                <span className="block text-sm text-muted">{t(desc)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-positive-soft text-positive-ink">
                <Mail size={26} aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold">{t("auth.done.title")}</h2>
              <p className="mt-2 text-sm text-muted">{t("auth.done.body", { email })}</p>
              <Button asChild className="mt-5">
                <Link href="/login">{t("auth.done.login")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold">{t("auth.signup.title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("auth.signup.subtitle")}</p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Field htmlFor="email" label={t("auth.signup.email")}>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    dir="ltr"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-start"
                  />
                </Field>

                <Field htmlFor="phone" label={t("auth.signup.phone")}>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="+7 900 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mono text-start"
                  />
                </Field>

                <Field htmlFor="password" label={t("auth.signup.password")} hint={t("auth.signup.passwordHint")}>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pe-20 text-start"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 end-0 flex items-center px-3 text-xs font-medium text-muted hover:text-fg"
                    >
                      {showPassword ? t("auth.signup.hide") : t("auth.signup.show")}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-1" role="img" aria-label={`${t("auth.signup.strength")}: ${strength}/3`}>
                      {[1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            i <= strength ? (strength === 1 ? "bg-negative" : strength === 2 ? "bg-warning" : "bg-positive") : "bg-surface-2"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </Field>

                {error && (
                  <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={loading} size="lg" className="mt-1">
                  {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                {t("auth.signup.haveAccount")}{" "}
                <Link href="/login" className="font-medium text-brand underline underline-offset-2">
                  {t("auth.signup.login")}
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function passwordStrength(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10 && /[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) score++;
  if (pw.length >= 10 && /[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.max(1, score);
}
