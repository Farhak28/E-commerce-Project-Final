"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { language } = useAppPreferences();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? t("invalidCredentials", language));
      return;
    }
    router.push(res.isAdmin ? "/admin" : "/");
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
        {t("loginTitle", language)}
      </h1>
      <Card>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input name="email" placeholder={t("email", language)} type="email" autoComplete="email" required suppressHydrationWarning />
          <Input name="password" placeholder={t("password", language)} type="password" autoComplete="current-password" required suppressHydrationWarning />
          <Button type="submit" className="w-full" disabled={submitting} suppressHydrationWarning>
            {submitting ? "Signing in…" : t("signin", language)}
          </Button>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
        </form>
        <p className="mt-4 text-sm text-text-muted" suppressHydrationWarning>
          {t("newHere", language)}{" "}
          <Link href="/register" className="font-semibold text-primary">
            {t("register", language)}
          </Link>
        </p>
      </Card>
    </div>
  );
}
