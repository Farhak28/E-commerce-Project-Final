"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getAccountCoupons } from "@/lib/services/account";
import type { UserCouponDTO } from "@/lib/types";
import { useI18n, useLocaleCode } from "@/lib/use-i18n";

export default function AccountCouponsPage() {
  const { isSignedIn } = useAuth();
  const { t, language } = useI18n();
  const locale = useLocaleCode(language);

  function formatExpiry(iso: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
  const [coupons, setCoupons] = useState<UserCouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setCoupons([]);
      setLoading(false);
      return;
    }
    void getAccountCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  const available = coupons.filter((c) => !c.isUsed && new Date(c.expiresAt) > new Date());
  const used = coupons.filter((c) => c.isUsed);
  const expired = coupons.filter((c) => !c.isUsed && new Date(c.expiresAt) <= new Date());

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <p className="text-sm text-text-muted" suppressHydrationWarning>{t("signInForCoupons")}</p>
        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
          {t("signin")}
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>{t("couponsTitle")}</h1>
        <p className="mt-1 text-sm text-text-muted" suppressHydrationWarning>{t("couponsSubtitle")}</p>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold" suppressHydrationWarning>{t("couponsAvailable", { count: available.length })}</h2>
            {available.length === 0 ? (
              <Card>
                <p className="text-sm text-text-muted" suppressHydrationWarning>{t("couponsUnlockHint")}</p>
                <Link href="/products" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
                  {t("browseProducts")}
                </Link>
              </Card>
            ) : (
              available.map((coupon) => (
                <Card key={coupon.id} className="border-primary/20 bg-primary/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{coupon.title}</p>
                      <p className="mt-1 text-sm text-text-muted">{coupon.description}</p>
                      <p className="mt-2 text-sm font-medium text-primary">{coupon.discountLabel}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {t("minOrder")} ${coupon.minOrderAmount.toFixed(2)} · {t("expires")} {formatExpiry(coupon.expiresAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <code className="rounded-lg bg-surface px-3 py-1.5 text-sm font-bold tracking-wide">
                        {coupon.code}
                      </code>
                      <Button type="button" size="sm" variant="outline" onClick={() => void copyCode(coupon.code)}>
                        {copied === coupon.code ? t("copied") : t("copyCode")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </section>

          {used.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-text-muted" suppressHydrationWarning>{t("used")}</h2>
              {used.map((coupon) => (
                <Card key={coupon.id} className="opacity-70">
                  <p className="font-semibold">{coupon.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{coupon.code} · {t("usedLabel")}</p>
                </Card>
              ))}
            </section>
          ) : null}

          {expired.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-text-muted" suppressHydrationWarning>{t("expired")}</h2>
              {expired.map((coupon) => (
                <Card key={coupon.id} className="opacity-60">
                  <p className="font-semibold">{coupon.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{coupon.code}</p>
                </Card>
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
