"use client";



import { useEffect, useState } from "react";

import { AdminLoadingGrid, AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";

import { Card } from "@/components/ui";

import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

import { getAdminAiAnalytics, getAdminAiOverview } from "@/lib/services/admin-ai";

import type { AdminAiAnalyticsDTO, AdminAiOverviewDTO } from "@/lib/types";



export default function AdminAiAnalyticsPage() {

  const { t } = useAdminI18n();

  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);

  const [analytics, setAnalytics] = useState<AdminAiAnalyticsDTO | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    void Promise.all([getAdminAiOverview(), getAdminAiAnalytics()])

      .then(([overview, data]) => {

        setAi(overview);

        setAnalytics(data);

      })

      .catch(() => {

        setAi(null);

        setAnalytics(null);

      })

      .finally(() => setLoading(false));

  }, []);



  const chatItems = analytics?.chatsByDay.map((d) => ({ label: d.date, value: d.count })) ?? [];



  return (

    <div className="space-y-6">

      <AdminPageHeader title={t("analyticsTitle")} description={t("analyticsDesc")} />



      {loading ? (

        <AdminLoadingGrid count={4} />

      ) : (

        <>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <AdminStatCard label={t("statTotalChats")} value={ai?.totalConversations ?? "—"} />

            <AdminStatCard label={t("statToday")} value={ai?.conversationsToday ?? "—"} tone="success" />

            <AdminStatCard label={t("statSessions")} value={ai?.uniqueSessions ?? "—"} />

            <AdminStatCard label={t("statAvgLatency")} value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"} />

          </div>



          {chatItems.length > 0 ? (

            <Card>

              <h2 className="font-semibold">{t("dailyConversations")}</h2>

              <div className="mt-4 space-y-2">

                {chatItems.map((item) => (

                  <div key={item.label} className="flex justify-between text-sm">

                    <span className="text-text-muted">{item.label}</span>

                    <span className="font-semibold tabular-nums">{item.value}</span>

                  </div>

                ))}

              </div>

            </Card>

          ) : null}



          {analytics?.toolUsage.length ? (

            <AdminTable

              columns={[t("colTool"), t("colCalls")]}

              rows={analytics.toolUsage.map((row) => [row.toolName, String(row.count)])}

            />

          ) : null}



          {analytics?.topPrompts.length ? (

            <AdminTable

              columns={[t("colQuestion"), t("colCount")]}

              rows={analytics.topPrompts.map((p) => [

                <span key={p.prompt} className="line-clamp-2 max-w-xl">{p.prompt}</span>,

                String(p.count),

              ])}

            />

          ) : null}

        </>

      )}

    </div>

  );

}

