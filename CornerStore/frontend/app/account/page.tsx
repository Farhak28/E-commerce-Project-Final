"use client";

import { Card } from "@/components/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/components/theme-provider";
import { getAccountDashboard } from "@/lib/services/account";
import { getOrders } from "@/lib/services/orders";
import { RECENTLY_VIEWED_KEY } from "@/lib/constants/storage";
import { getProducts } from "@/lib/services/products";
import { mapProductDTO } from "@/lib/utils/product";
import type { AccountDashboardDTO } from "@/lib/types";

export default function AccountPage() {
  const { isSignedIn, isAdmin } = useAuth();
  const { language } = useAppPreferences();
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
          <h1 className="section-title text-3xl font-bold text-white">
            {language === "ar" ? "الحساب" : "Account"}
          </h1>
          <p className="mt-1 text-sm text-white/90">
            {language === "ar"
              ? "الرجاء تسجيل الدخول لعرض تفاصيل حسابك."
              : "Please sign in to view your account details."}
          </p>
        </section>
        <Card>
          <Link href="/login" className="inline-flex font-semibold text-primary">
            {language === "ar" ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
        <h1 className="section-title text-3xl font-bold text-white">{language === "ar" ? "حسابي" : "My Account"}</h1>
        <p className="mt-1 text-sm text-white/90">
          {language === "ar"
            ? "إدارة الملف الشخصي والطلبات والمفضلة."
            : "Manage profile, orders, favorites, and personalized recommendations."}
        </p>
      </section>
      {isAdmin ? (
        <Card className="border-primary/30 bg-primary/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title text-xl font-semibold">
                {language === "ar" ? "لوحة الإدارة" : "Admin Console"}
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                {language === "ar"
                  ? "إدارة المنتجات والطلبات والمستخدمين وإعدادات الذكاء الاصطناعي."
                  : "Manage products, orders, users, AI settings, and store analytics."}
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {language === "ar" ? "فتح لوحة الإدارة" : "Open Admin Console"}
            </Link>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="section-title text-xl font-semibold">Profile dashboard</h2>
          <p className="mt-2 text-sm text-text-muted">Account details, preferences, and loyalty stats.</p>
          <p className="mt-3 text-xs text-primary">
            Profile completion: {dashboard?.profileCompletionPercent ?? "—"}%
            {dashboard ? ` · ${dashboard.loyaltyTier} tier` : ""}
          </p>
          <Link href="/account/dashboard" className="mt-3 inline-flex text-sm font-semibold text-primary">
            Open dashboard
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">Order history</h2>
          <p className="mt-2 text-sm text-text-muted">Track previous orders with shipping timeline and status badges.</p>
          <div className="mt-3 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs">
            {activeOrders} active order{activeOrders === 1 ? "" : "s"}
          </div>
          <Link href="/account/orders" className="mt-3 inline-flex text-sm font-semibold text-primary">
            View all orders
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">
            {language === "ar" ? "العناوين المحفوظة" : "Saved addresses"}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {language === "ar"
              ? "احفظ أي عدد من العناوين بأسماء مخصصة لتسريع الدفع."
              : "Manage unlimited delivery addresses with custom names."}
          </p>
          <Link href="/account/addresses" className="mt-3 inline-flex text-sm font-semibold text-primary">
            {language === "ar" ? "إدارة العناوين" : "Manage addresses"}
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">My coupons</h2>
          <p className="mt-2 text-sm text-text-muted">
            Personalized discounts earned from your order history and spend.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-200">
            {dashboard?.availableCoupons ?? 0} available
          </p>
          <Link href="/account/coupons" className="mt-3 inline-flex text-sm font-semibold text-primary">
            View coupons
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">Wishlist</h2>
          <p className="mt-2 text-sm text-text-muted">Saved favorites with stock alerts and promo updates.</p>
          <Link href="/wishlist" className="mt-3 inline-flex text-sm font-semibold text-primary">
            Open wishlist
          </Link>
        </Card>
        <Card>
          <h2 className="section-title text-xl font-semibold">Recently viewed</h2>
          <p className="mt-2 text-sm text-text-muted">Quickly revisit products and continue where you left off.</p>
          <p className="mt-3 text-xs text-text-muted">
            {recentNames.length
              ? `Last seen: ${recentNames.join(", ")}`
              : "Browse products to build your history."}
          </p>
          <Link href="/account/recently-viewed" className="mt-3 inline-flex text-sm font-semibold text-primary">
            Open recent items
          </Link>
        </Card>
      </div>
    </div>
  );
}
