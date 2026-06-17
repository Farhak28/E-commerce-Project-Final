"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminLoadingGrid,
  AdminPageHeader,
  AdminStatCard,
  HealthPill,
} from "@/components/admin/admin-ui";
import { Button, Card } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminAiOverview } from "@/lib/services/admin-ai";
import { getAdminKnowledgeStats } from "@/lib/services/admin-ai";
import type { AdminAiOverviewDTO, KnowledgeStatsDTO } from "@/lib/types";

export default function AdminAiOverviewPage() {
  const { t } = useAdminI18n();
  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getAdminAiOverview(), getAdminKnowledgeStats()])
      .then(([overview, stats]) => {
        setAi(overview);
        setKnowledge(stats);
        setError(null);
      })
      .catch((e) => {
        setAi(null);
        setKnowledge(null);
        setError(e instanceof Error ? e.message : t("failedToLoadAiOverview"));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("aiManagementTitle")}
        description={t("aiManagementDescGemini")}
        actions={
          <Link href="/admin/ai/knowledge">
            <Button type="button">{t("manageKnowledge")}</Button>
          </Link>
        }
      />

      {error ? (
        <Card className="border-accent/40 bg-accent/5">
          <p className="text-sm font-semibold text-accent">{t("couldNotLoadAi")}</p>
          <p className="mt-1 text-sm text-text-muted">{error}</p>
          <p className="mt-2 text-xs text-text-muted">{t("aiMigrationHint")}</p>
        </Card>
      ) : null}

      {loading ? (
        <AdminLoadingGrid count={6} />
      ) : !error ? (
        <>
          <div className="flex flex-wrap gap-2">
            <HealthPill
              ok={!!ai?.geminiConfigured}
              label={ai?.geminiConfigured ? t("geminiConnected") : t("geminiNotConfigured")}
            />
            <HealthPill
              ok={(knowledge?.documentCount ?? 0) > 0}
              label={t("knowledgeDocsCount", { count: knowledge?.documentCount ?? 0 })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              label={t("statTotalConversations")}
              value={ai?.totalConversations ?? "—"}
              hint={t("hintToday", { count: ai?.conversationsToday ?? 0 })}
            />
            <AdminStatCard label={t("statUniqueSessions")} value={ai?.uniqueSessions ?? "—"} />
            <AdminStatCard label={t("statAvgLatency")} value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"} />
            <AdminStatCard label={t("statKnowledgeDocuments")} value={knowledge?.documentCount ?? "—"} />
            <AdminStatCard label={t("statIndexedChunks")} value={knowledge?.chunkCount ?? "—"} />
            <AdminStatCard label={t("statModel")} value={ai?.geminiModel ?? "—"} hint={ai?.geminiProvider ?? undefined} />
          </div>

          <Card>
            <h2 className="font-semibold">{t("quickLinks")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/ai/knowledge" className="text-sm font-semibold text-primary">{t("quickKnowledgeLink")}</Link>
              <Link href="/admin/ai/analytics" className="text-sm font-semibold text-primary">{t("quickChatAnalyticsLink")}</Link>
              <Link href="/admin/ai/logs" className="text-sm font-semibold text-primary">{t("quickLogsLink")}</Link>
              <Link href="/admin/system" className="text-sm font-semibold text-primary">{t("quickSystemLink")}</Link>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
