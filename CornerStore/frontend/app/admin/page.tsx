"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getAdminAiOverview } from "@/lib/services/admin-ai";
import { getAdminAnalytics, getAdminCouponsSummary, getAdminStats } from "@/lib/services/admin";
import type {
  AdminAiOverviewDTO,
  AdminAnalyticsDTO,
  AdminCouponsSummaryDTO,
  AdminStatsDTO,
} from "@/lib/types";

const FEATURE_LINKS = [
  {
    href: "/admin/orders",
    title: "Order tracking",
    desc: "Fulfillment stages, scheduled delivery, coupons on orders",
    tag: "Fulfillment",
  },
  {
    href: "/admin/coupons",
    title: "Loyalty coupons",
    desc: "Purchase-based rewards issued per customer",
    tag: "Coupons",
  },
  {
    href: "/admin/reviews",
    title: "Product reviews",
    desc: "Star ratings and customer feedback moderation",
    tag: "Reviews",
  },
  {
    href: "/admin/ai/visual-search",
    title: "Visual search",
    desc: "Image-based product discovery events",
    tag: "AI",
  },
  {
    href: "/admin/products",
    title: "Brand official links",
    desc: "Manufacturer URLs on product & compare pages",
    tag: "Catalog",
  },
  {
    href: "/admin/ai",
    title: "AI assistant",
    desc: "Chat tools, cart, wishlist, recommendations",
    tag: "AI",
  },
];

export default function AdminPage() {
  const { isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [coupons, setCoupons] = useState<AdminCouponsSummaryDTO | null>(null);
  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(res.error ?? "Invalid credentials");
      return;
    }
    router.refresh();
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-12">
        <AdminPageHeader
          title="Admin Console"
          description="Sign in with an Admin or SuperAdmin account to manage Corner Store and the AI assistant."
        />
        <Card>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input name="email" placeholder="Admin email" type="email" required />
            <Input name="password" placeholder="Password" type="password" required />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Store performance, fulfillment pipeline, loyalty coupons, reviews, and AI assistant activity."
      />

      {loading ? (
        <AdminLoadingGrid count={12} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Business</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
              <AdminStatCard label="Revenue" value={`$${(stats?.revenue ?? 0).toLocaleString()}`} />
              <AdminStatCard label="Orders" value={stats?.ordersCount ?? "—"} />
              <AdminStatCard label="Customers" value={stats?.usersCount ?? "—"} />
              <AdminStatCard label="Products" value={stats?.productsCount ?? "—"} />
              <AdminStatCard label="Pending orders" value={stats?.pendingOrdersCount ?? "—"} tone="warning" />
              <AdminStatCard
                label="Inventory alerts"
                value={stats?.lowStockCount ?? "—"}
                tone={(stats?.lowStockCount ?? 0) > 0 ? "warning" : "default"}
                hint="≤10 in stock"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Fulfillment & delivery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Active shipments"
                value={stats?.activeShipmentsCount ?? "—"}
                hint="In fulfillment pipeline"
                tone="default"
              />
              <AdminStatCard label="Delivered" value={stats?.deliveredOrdersCount ?? "—"} tone="success" />
              <AdminStatCard
                label="Scheduled deliveries"
                value={stats?.scheduledDeliveriesCount ?? analytics?.scheduledDeliveriesCount ?? "—"}
                hint="Time-slot pricing applied"
              />
              <AdminStatCard
                label="Delivery revenue"
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
              Loyalty & engagement
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Active coupons"
                value={stats?.activeCouponsCount ?? coupons?.activeCoupons ?? "—"}
                hint={`${coupons?.redeemedCoupons ?? stats?.redeemedCouponsCount ?? 0} redeemed`}
              />
              <AdminStatCard
                label="Discounts given"
                value={`$${(stats?.totalDiscountsGiven ?? coupons?.totalDiscountsGiven ?? 0).toFixed(2)}`}
              />
              <AdminStatCard label="Product reviews" value={stats?.reviewsCount ?? "—"} />
              <AdminStatCard
                label="Brands with official URL"
                value={stats?.brandsWithOfficialUrlCount ?? "—"}
                hint="Linked on product pages"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">AI Assistant</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <AdminStatCard
                label="Total conversations"
                value={ai?.totalConversations ?? "—"}
                hint={`${ai?.conversationsToday ?? 0} today`}
              />
              <AdminStatCard
                label="Avg response time"
                value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"}
              />
              <AdminStatCard label="Recommendations" value={ai?.recommendationRequests ?? "—"} hint="Tool calls" />
              <AdminStatCard
                label="Visual searches"
                value={analytics?.visualSearchEventsCount ?? "—"}
              />
              <AdminStatCard
                label="Gemini status"
                value={ai?.geminiConfigured ? "Connected" : "Not configured"}
                tone={ai?.geminiConfigured ? "success" : "warning"}
                hint={ai?.geminiModel ?? undefined}
              />
            </div>
          </section>
        </>
      )}

      <AdminCharts analytics={analytics} ai={ai} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Store features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="h-full transition hover:border-primary/30 hover:shadow-md">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {item.tag}
                </span>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
                <span className="mt-3 inline-flex text-sm font-semibold text-primary">Manage →</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/products", title: "Products", desc: "Catalog, brands & official links" },
          { href: "/admin/orders", title: "Orders", desc: "Tracking, scheduling & discounts" },
          { href: "/admin/coupons", title: "Coupons", desc: "Loyalty rewards overview" },
          { href: "/admin/users", title: "Customers", desc: "User management" },
          { href: "/admin/reviews", title: "Reviews", desc: "Ratings moderation" },
          { href: "/admin/ai", title: "AI Overview", desc: "Assistant metrics" },
          { href: "/admin/ai/knowledge", title: "Knowledge Base", desc: "RAG documents & chunks" },
          { href: "/admin/ai/visual-search", title: "Visual Search", desc: "Image search analytics" },
          { href: "/admin/ai/analytics", title: "Chat Analytics", desc: "Conversation insights" },
          { href: "/admin/system", title: "System Health", desc: "API, DB & fulfillment worker" },
          { href: "/admin/reports", title: "Reports", desc: "Extended business reports" },
          { href: "/admin/audit", title: "Audit Logs", desc: "Admin change history" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full transition hover:border-primary/30 hover:shadow-md">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
              <span className="mt-3 inline-flex text-sm font-semibold text-primary">Open →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
