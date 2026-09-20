"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message.includes("Invalid login")
          ? t("auth.err.invalid")
          : signInError.message.includes("not confirmed")
            ? t("auth.err.unconfirmed")
            : signInError.message
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-6">
      <div className="flex flex-col items-center text-center">
        <Logo size={88} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("auth.login.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.login.subtitle")}</p>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field htmlFor="email" label={t("auth.login.email")}>
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
            <Field htmlFor="password" label={t("auth.login.password")}>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-start"
              />
            </Field>
            {error && (
              <p role="alert" className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative-ink">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} size="lg">
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-muted">
        {t("auth.login.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-brand underline underline-offset-2">
          {t("auth.login.signup")}
        </Link>
      </p>
    </div>
  );
}
