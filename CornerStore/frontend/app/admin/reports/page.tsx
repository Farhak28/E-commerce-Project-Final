"use client";

import { useEffect, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { getAdminAnalytics, getAdminReports } from "@/lib/services/admin";
import type { AdminAnalyticsDTO, AdminReportsDTO } from "@/lib/types";

export default function AdminReportsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [reports, setReports] = useState<AdminReportsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getAdminAnalytics(), getAdminReports()])
      .then(([a, r]) => {
        setAnalytics(a);
        setReports(r);
      })
      .catch(() => {
        setAnalytics(null);
        setReports(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Reports" description="Business performance summaries and operational metrics." />
      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminStatCard label="Total reviews" value={reports?.totalReviews ?? "—"} />
            <AdminStatCard label="Average rating" value={reports ? reports.averageRating.toFixed(1) : "—"} />
            <AdminStatCard label="Low stock products" value={reports?.lowStockProducts ?? "—"} tone="warning" />
            <AdminStatCard label="AI conversations" value={analytics?.assistantUsageEstimate ?? "—"} />
            <AdminStatCard label="Scheduled deliveries" value={analytics?.scheduledDeliveriesCount ?? "—"} />
            <AdminStatCard
              label="Coupon discounts"
              value={analytics ? `$${analytics.totalDiscountsGiven.toFixed(2)}` : "—"}
            />
          </div>
          <AdminCharts analytics={analytics} ai={null} />
        </>
      )}
    </div>
  );
}
