"use client";

import { Card } from "@/components/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAccountDashboard } from "@/lib/services/account";
import { getOrders } from "@/lib/services/orders";
import { RECENTLY_VIEWED_KEY } from "@/lib/constants/storage";
import { getProducts } from "@/lib/services/products";
import { mapProductDTO } from "@/lib/utils/product";
import type { AccountDashboardDTO } from "@/lib/types";
import { useI18n } from "@/lib/use-i18n";

export default function AccountPage() {
  const { isSignedIn, isAdmin } = useAuth();
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<AccountDashboardDTO | null>(null);
  const [activeOrders, setActiveOrders] = useState(0);
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    void getAccountDashboard().then(setDashboard).catch(() => setDashboard(null));
    void getOrders()
      .then((orders) => {
        const inactive = new Set(["Cancelled", "Returned", "PaymentFailed"]);
        const active = orders.filter((o) => !inactive.has(o.status)).length;
        setActiveOrders(active);
      })
      .catch(() => setActiveOrders(0));

    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      if (ids.length) {
        void getProducts({ pageIndex: 1, pageSize: 50 }).then((res) => {
          const names = ids
            .map((id) => res.data.find((p) => p.id === id))
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => mapProductDTO(p!).name);
          setRecentNames(names);
        });
      }
    } catch {
      /* ignore */
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
          <h1 className="section-title text-3xl font-bold text-white" suppressHydrationWarning>
            {t("account")}
          </h1>
          <p className="mt-1 text-sm text-white/90" suppressHydrationWarning>
            {t("signInToViewAccount")}
          </p>
        </section>
        <Card>
          <Link href="/login" className="inline-flex font-semibold text-primary" suppressHydrationWarning>
            {t("signin")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
        <h1 className="section-title text-3xl font-bold text-white" suppressHydrationWarning>
          {t("myAccount")}
        </h1>
        <p className="mt-1 text-sm text-white/90" suppressHydrationWarning>
          {t("accountManageDesc")}
        </p>
      </section>
      {isAdmin ? (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
                {t("adminConsole")}
              </h2>
              <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
                {t("adminConsoleDesc")}
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              suppressHydrationWarning
            >
              {t("openAdminConsole")}
            </Link>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("profileDashboard")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("profileDashboardDesc")}
          </p>
          <p className="mt-3 text-xs text-primary">
            {t("profileCompletion")}: {dashboard?.profileCompletionPercent ?? "—"}%
            {dashboard ? ` · ${dashboard.loyaltyTier} ${t("tier")}` : ""}
          </p>
          <Link href="/account/dashboard" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("openDashboard")}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("orderHistory")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("orderHistoryDesc")}
          </p>
          <div className="mt-3 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs" suppressHydrationWarning>
            {activeOrders === 1
              ? t("activeOrders", { count: activeOrders })
              : t("activeOrdersPlural", { count: activeOrders })}
          </div>
          <Link href="/account/orders" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("viewAllOrders")}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("savedAddresses")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("savedAddressesDesc")}
          </p>
          <Link href="/account/addresses" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("manageAddresses")}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("myCoupons")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("myCouponsDesc")}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-200" suppressHydrationWarning>
            {t("availableCount", { count: dashboard?.availableCoupons ?? 0 })}
          </p>
          <Link href="/account/coupons" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("viewCoupons")}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("wishlist")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("wishlistDesc")}
          </p>
          <Link href="/wishlist" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("openWishlist")}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>
            {t("recentlyViewed")}
          </h2>
          <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
            {t("recentlyViewedDesc")}
          </p>
          <p className="mt-3 text-xs text-text-muted" suppressHydrationWarning>
            {recentNames.length
              ? t("lastSeen", { names: recentNames.join(", ") })
              : t("browseToBuildHistory")}
          </p>
          <Link href="/account/recently-viewed" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("openRecentItems")}
          </Link>
        </Card>
      </div>
    </div>
  );
}
