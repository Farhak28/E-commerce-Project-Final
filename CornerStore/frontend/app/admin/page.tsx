"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getAdminAiOverview } from "@/lib/services/admin-ai";
import { getAdminAnalytics, getAdminStats } from "@/lib/services/admin";
import type { AdminAiOverviewDTO, AdminAnalyticsDTO, AdminStatsDTO } from "@/lib/types";

export default function AdminPage() {
  const { isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    void Promise.all([getAdminStats(), getAdminAnalytics(), getAdminAiOverview()])
      .then(([s, a, aiOverview]) => {
        setStats(s);
        setAnalytics(a);
        setAi(aiOverview);
      })
      .catch(() => {
        setStats(null);
        setAnalytics(null);
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
        description="Business performance and AI shopping assistant activity at a glance."
      />

      {loading ? (
        <AdminLoadingGrid count={8} />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Business</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <AdminStatCard label="Revenue" value={`$${(stats?.revenue ?? 0).toLocaleString()}`} />
              <AdminStatCard label="Orders" value={stats?.ordersCount ?? "—"} />
              <AdminStatCard label="Customers" value={stats?.usersCount ?? "—"} />
              <AdminStatCard label="Products" value={stats?.productsCount ?? "—"} />
              <AdminStatCard
                label="Pending orders"
                value={stats?.pendingOrdersCount ?? "—"}
                tone="warning"
              />
              <AdminStatCard
                label="Inventory alerts"
                value={stats?.lowStockCount ?? "—"}
                tone={(stats?.lowStockCount ?? 0) > 0 ? "warning" : "default"}
                hint="≤10 in stock"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">AI Assistant</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Total conversations"
                value={ai?.totalConversations ?? "—"}
                hint={`${ai?.conversationsToday ?? 0} today`}
              />
              <AdminStatCard
                label="Avg response time"
                value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"}
              />
              <AdminStatCard
                label="Recommendations"
                value={ai?.recommendationRequests ?? "—"}
                hint="Tool calls"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/products", title: "Products", desc: "Catalog & inventory" },
          { href: "/admin/orders", title: "Orders", desc: "Fulfillment & status" },
          { href: "/admin/users", title: "Customers", desc: "User management" },
          { href: "/admin/ai", title: "AI Overview", desc: "Assistant metrics" },
          { href: "/admin/ai/knowledge", title: "Knowledge Base", desc: "RAG documents & chunks" },
          { href: "/admin/ai/analytics", title: "Chat Analytics", desc: "Conversation insights" },
          { href: "/admin/system", title: "System Health", desc: "API & AI monitoring" },
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
