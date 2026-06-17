"use client";



import { useEffect, useState } from "react";

import { AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";

import { AdminLoadingGrid } from "@/components/admin/admin-ui";

import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

import { getAdminRecommendationAnalytics } from "@/lib/services/admin-ai";

import type { RecommendationAnalyticsDTO } from "@/lib/types";



export default function AdminRecommendationsPage() {

  const { t } = useAdminI18n();

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

      <AdminPageHeader title={t("recTitle")} description={t("recDescExtended")} />

      {loading ? (

        <AdminLoadingGrid count={4} />

      ) : (

        <>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <AdminStatCard label={t("statImpressions")} value={data?.totalImpressions ?? 0} />

            <AdminStatCard label={t("statClicks")} value={data?.totalClicks ?? 0} />

            <AdminStatCard label={t("statClickRate")} value={data ? `${(data.overallClickRate * 100).toFixed(1)}%` : "—"} />

            <AdminStatCard label={t("statAiRecRequests")} value={data?.aiRecommendationRequests ?? 0} hint={t("fromChatTools")} />

          </div>

          <section>

            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("mostRecommended")}</h2>

            <AdminTable

              columns={[t("colProduct"), t("statImpressions"), t("statClicks"), t("colCtr")]}

              rows={(data?.topRecommended ?? []).map((p) => [

                p.productName,

                p.impressionCount,

                p.clickCount,

                `${(p.clickRate * 100).toFixed(1)}%`,

              ])}

              emptyMessage={t("noRecEventsBrowse")}

            />

          </section>

          <section>

            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("trendingProducts")}</h2>

            <AdminTable

              columns={[t("colProduct"), t("statImpressions"), t("statClicks"), t("colScore")]}

              rows={(data?.trendingProducts ?? []).map((p) => [

                p.productName,

                p.impressionCount,

                p.clickCount,

                p.impressionCount + p.clickCount * 2,

              ])}

              emptyMessage={t("noTrendingData")}

            />

          </section>

        </>

      )}

    </div>

  );

}

