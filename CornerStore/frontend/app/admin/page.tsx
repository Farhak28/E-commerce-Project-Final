"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { useAuth } from "@/lib/auth-context";
import { getAdminAiOverview } from "@/lib/services/admin-ai";
import { getAdminAnalytics, getAdminCouponsSummary, getAdminStats } from "@/lib/services/admin";
import type {
  AdminAiOverviewDTO,
  AdminAnalyticsDTO,
  AdminCouponsSummaryDTO,
  AdminStatsDTO,
} from "@/lib/types";

export default function AdminPage() {
  const { t } = useAdminI18n();
  const { isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [coupons, setCoupons] = useState<AdminCouponsSummaryDTO | null>(null);
  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const featureLinks = useMemo(
    () => [
      {
        href: "/admin/orders",
        title: t("featOrderTracking"),
        desc: t("featOrderTrackingDesc"),
        tag: t("tagFulfillment"),
      },
      {
        href: "/admin/returns",
        title: t("featReturns"),
        desc: t("featReturnsDesc"),
        tag: t("tagFulfillment"),
      },
      {
        href: "/admin/coupons",
        title: t("featLoyaltyCoupons"),
        desc: t("featLoyaltyCouponsDesc"),
        tag: t("tagCoupons"),
      },
      {
        href: "/admin/reviews",
        title: t("featProductReviews"),
        desc: t("featProductReviewsDesc"),
        tag: t("tagReviews"),
      },
      {
        href: "/admin/ai/visual-search",
        title: t("featVisualSearch"),
        desc: t("featVisualSearchDesc"),
        tag: t("tagAi"),
      },
      {
        href: "/admin/products",
        title: t("featBrandLinks"),
        desc: t("featBrandLinksDesc"),
        tag: t("tagCatalog"),
      },
      {
        href: "/admin/ai",
        title: t("featAiAssistant"),
        desc: t("featAiAssistantDesc"),
        tag: t("tagAi"),
      },
    ],
    [t],
  );

  const quickLinks = useMemo(
    () => [
      { href: "/admin/products", title: t("navProducts"), desc: t("quickProductsDesc") },
      { href: "/admin/orders", title: t("navOrders"), desc: t("quickOrdersDesc") },
      { href: "/admin/coupons", title: t("navCoupons"), desc: t("quickCouponsDesc") },
      { href: "/admin/users", title: t("navCustomers"), desc: t("quickCustomersDesc") },
      { href: "/admin/reviews", title: t("navReviews"), desc: t("quickReviewsDesc") },
      { href: "/admin/ai", title: t("navAiOverview"), desc: t("quickAiDesc") },
      { href: "/admin/ai/knowledge", title: t("navKnowledgeBase"), desc: t("quickKnowledgeDesc") },
      { href: "/admin/ai/visual-search", title: t("navVisualSearch"), desc: t("quickVisualSearchDesc") },
      { href: "/admin/ai/analytics", title: t("navChatAnalytics"), desc: t("quickChatAnalyticsDesc") },
      { href: "/admin/system", title: t("navSystemHealth"), desc: t("quickSystemDesc") },
      { href: "/admin/reports", title: t("navReports"), desc: t("quickReportsDesc") },
      { href: "/admin/audit", title: t("navAuditLogs"), desc: t("quickAuditDesc") },
    ],
    [t],
  );

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    void Promise.all([
      getAdminStats(),
      getAdminAnalytics(),
      getAdminCouponsSummary(),
      getAdminAiOverview(),
    ])
      .then(([s, a, c, aiOverview]) => {
        setStats(s);
        setAnalytics(a);
        setCoupons(c);
        setAi(aiOverview);
      })
      .catch(() => {
        setStats(null);
        setAnalytics(null);
        setCoupons(null);
        setAi(null);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    if (!res.ok) {
      setError(res.error ?? t("invalidCredentials"));
      return;
    }
    router.refresh();
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-12">
        <AdminPageHeader title={t("adminConsole")} description={t("adminLoginDesc")} />
        <Card>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input name="email" placeholder={t("adminEmail")} type="email" required />
            <Input name="password" placeholder={t("password")} type="password" required />
            <Button type="submit" className="w-full">
              {t("signIn")}
            </Button>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title={t("dashboardTitle")} description={t("dashboardDesc")} />

      {loading ? (
        <AdminLoadingGrid count={12} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("sectionBusiness")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
              <AdminStatCard label={t("statRevenue")} value={`$${(stats?.revenue ?? 0).toLocaleString()}`} />
              <AdminStatCard label={t("statOrders")} value={stats?.ordersCount ?? "—"} />
              <AdminStatCard label={t("statCustomers")} value={stats?.usersCount ?? "—"} />
              <AdminStatCard label={t("statProducts")} value={stats?.productsCount ?? "—"} />
              <AdminStatCard label={t("statPendingOrders")} value={stats?.pendingOrdersCount ?? "—"} tone="warning" />
              <AdminStatCard
                label={t("statInventoryAlerts")}
                value={stats?.lowStockCount ?? "—"}
                tone={(stats?.lowStockCount ?? 0) > 0 ? "warning" : "default"}
                hint={t("hintLowStock")}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("sectionFulfillment")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label={t("statActiveShipments")}
                value={stats?.activeShipmentsCount ?? "—"}
                hint={t("hintFulfillmentPipeline")}
                tone="default"
              />
              <AdminStatCard label={t("statDelivered")} value={stats?.deliveredOrdersCount ?? "—"} tone="success" />
              <AdminStatCard
                label={t("statPendingReturns")}
                value={stats?.pendingReturnsCount ?? "—"}
                tone={(stats?.pendingReturnsCount ?? 0) > 0 ? "warning" : "default"}
                hint={t("hintAwaitingReview")}
              />
              <AdminStatCard
                label={t("statScheduledDeliveries")}
                value={stats?.scheduledDeliveriesCount ?? analytics?.scheduledDeliveriesCount ?? "—"}
                hint={t("hintTimeSlotPricing")}
              />
              <AdminStatCard
                label={t("statDeliveryRevenue")}
                value={
                  analytics
                    ? `$${analytics.totalDeliveryRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "—"
                }
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("sectionLoyalty")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label={t("statActiveCoupons")}
                value={stats?.activeCouponsCount ?? coupons?.activeCoupons ?? "—"}
                hint={t("hintRedeemed", { count: coupons?.redeemedCoupons ?? stats?.redeemedCouponsCount ?? 0 })}
              />
              <AdminStatCard
                label={t("statDiscountsGiven")}
                value={`$${(stats?.totalDiscountsGiven ?? coupons?.totalDiscountsGiven ?? 0).toFixed(2)}`}
              />
              <AdminStatCard label={t("statProductReviews")} value={stats?.reviewsCount ?? "—"} />
              <AdminStatCard
                label={t("statBrandsOfficialUrl")}
                value={stats?.brandsWithOfficialUrlCount ?? "—"}
                hint={t("hintLinkedOnProduct")}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("sectionAi")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <AdminStatCard
                label={t("statTotalConversations")}
                value={ai?.totalConversations ?? "—"}
                hint={t("hintToday", { count: ai?.conversationsToday ?? 0 })}
              />
              <AdminStatCard
                label={t("statAvgResponseTime")}
                value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"}
              />
              <AdminStatCard label={t("statRecommendations")} value={ai?.recommendationRequests ?? "—"} hint={t("hintToolCalls")} />
              <AdminStatCard
                label={t("statVisualSearches")}
                value={analytics?.visualSearchEventsCount ?? "—"}
              />
              <AdminStatCard
                label={t("statGeminiStatus")}
                value={ai?.geminiConfigured ? t("connected") : t("notConfigured")}
                tone={ai?.geminiConfigured ? "success" : "warning"}
                hint={ai?.geminiModel ?? undefined}
              />
            </div>
          </section>
        </>
      )}

      <AdminCharts analytics={analytics} ai={ai} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("sectionStoreFeatures")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureLinks.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="h-full transition hover:border-primary/30 hover:shadow-md">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {item.tag}
                </span>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
                <span className="mt-3 inline-flex text-sm font-semibold text-primary">{t("manage")}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full transition hover:border-primary/30 hover:shadow-md">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
              <span className="mt-3 inline-flex text-sm font-semibold text-primary">{t("open")}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
