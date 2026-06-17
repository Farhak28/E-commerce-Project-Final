"use client";

import { useEffect, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminAnalytics, getAdminReports } from "@/lib/services/admin";
import type { AdminAnalyticsDTO, AdminReportsDTO } from "@/lib/types";

export default function AdminReportsPage() {
  const { t } = useAdminI18n();
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
      <AdminPageHeader title={t("reportsTitle")} description={t("reportsDesc")} />
      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminStatCard label={t("statTotalReviews")} value={reports?.totalReviews ?? "—"} />
            <AdminStatCard label={t("statAverageRating")} value={reports ? reports.averageRating.toFixed(1) : "—"} />
            <AdminStatCard label={t("statLowStockProducts")} value={reports?.lowStockProducts ?? "—"} tone="warning" />
            <AdminStatCard label={t("statAiConversations")} value={analytics?.assistantUsageEstimate ?? "—"} />
            <AdminStatCard label={t("statScheduledDeliveries")} value={analytics?.scheduledDeliveriesCount ?? "—"} />
            <AdminStatCard
              label={t("statCouponDiscounts")}
              value={analytics ? `$${analytics.totalDiscountsGiven.toFixed(2)}` : "—"}
            />
          </div>
          <AdminCharts analytics={analytics} ai={null} />
        </>
      )}
    </div>
  );
}
