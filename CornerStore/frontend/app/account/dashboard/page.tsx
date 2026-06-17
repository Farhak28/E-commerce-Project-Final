"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getAccountDashboard } from "@/lib/services/account";
import { useI18n } from "@/lib/use-i18n";
import type { AccountDashboardDTO } from "@/lib/types";

export default function DashboardPage() {
  const { isSignedIn, isAdmin } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<AccountDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    void getAccountDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <h1 className="section-title text-3xl font-bold">{t("profileDashboardTitle")}</h1>
        <Card>
          <Link href="/login" className="text-sm font-semibold text-primary">
            {t("signInDashboard")}
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="section-title text-3xl font-bold">{t("profileDashboardTitle")}</h1>
        <Card>
          <p className="text-sm text-text-muted">{t("dashboardLoadError")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">{t("profileDashboardTitle")}</h1>
      {isAdmin ? (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title text-lg font-semibold">{t("adminConsole")}</h2>
              <p className="mt-1 text-sm text-text-muted">{t("adminConsoleJump")}</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {t("openAdminConsole")}
            </Link>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-text-muted">{t("loyaltyTier")}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{data.loyaltyTier}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t("totalOrders")}</p>
          <p className="mt-2 text-2xl font-bold">{data.totalOrders}</p>
          {data.activeOrders > 0 ? (
            <p className="mt-1 text-xs text-text-muted">{t("activeLabel", { count: data.activeOrders })}</p>
          ) : null}
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t("rewardPoints")}</p>
          <p className="mt-2 text-2xl font-bold">{data.rewardPoints.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t("availableCoupons")}</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.availableCoupons}</p>
          <Link href="/account/coupons" className="mt-2 inline-flex text-xs font-semibold text-primary">
            {t("viewRewards")}
          </Link>
        </Card>
      </div>
      <Card>
        <p className="text-sm text-text-muted">{t("profileCompletion")}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${data.profileCompletionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold">{data.profileCompletionPercent}%</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="section-title text-xl font-semibold">{t("personalization")}</h2>
          <p className="mt-2 text-sm text-text-muted">
            {t("topInterests")} {data.topInterests.join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.topInterests.map((x) => (
              <span key={x} className="rounded-full bg-surface-2 px-3 py-1 text-xs">
                {x}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">{t("savedPreferences")}</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
            {data.savedPreferences.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {data.lastViewedSummary ? (
            <p className="mt-3 text-xs text-primary">{data.lastViewedSummary}</p>
          ) : null}
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-1"
        >
          {t("orderHistoryLabel")}
        </Link>
        <Link
          href="/account/recently-viewed"
          className="rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-1"
        >
          {t("recentlyViewed")}
        </Link>
      </div>
    </div>
  );
}
