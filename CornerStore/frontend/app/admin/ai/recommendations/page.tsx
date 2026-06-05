"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { AdminLoadingGrid } from "@/components/admin/admin-ui";
import { getAdminRecommendationAnalytics } from "@/lib/services/admin-ai";
import type { RecommendationAnalyticsDTO } from "@/lib/types";

export default function AdminRecommendationsPage() {
  const [data, setData] = useState<RecommendationAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminRecommendationAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Recommendation Analytics" description="Track product recommendations, click rates, and trending items." />
      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Impressions" value={data?.totalImpressions ?? 0} />
            <AdminStatCard label="Clicks" value={data?.totalClicks ?? 0} />
            <AdminStatCard label="Click rate" value={data ? `${(data.overallClickRate * 100).toFixed(1)}%` : "—"} />
            <AdminStatCard label="AI rec. requests" value={data?.aiRecommendationRequests ?? 0} hint="From chat tools" />
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Most recommended</h2>
            <AdminTable
              columns={["Product", "Impressions", "Clicks", "CTR"]}
              rows={(data?.topRecommended ?? []).map((p) => [
                p.productName,
                p.impressionCount,
                p.clickCount,
                `${(p.clickRate * 100).toFixed(1)}%`,
              ])}
              emptyMessage="No recommendation events yet. Data appears as customers browse recommended products."
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Trending products</h2>
            <AdminTable
              columns={["Product", "Impressions", "Clicks", "Score"]}
              rows={(data?.trendingProducts ?? []).map((p) => [
                p.productName,
                p.impressionCount,
                p.clickCount,
                p.impressionCount + p.clickCount * 2,
              ])}
              emptyMessage="No trending data yet."
            />
          </section>
        </>
      )}
    </div>
  );
}
