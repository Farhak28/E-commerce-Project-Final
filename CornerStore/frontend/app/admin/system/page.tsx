"use client";

import { useEffect, useState } from "react";
import {
  AdminLoadingGrid,
  AdminPageHeader,
  HealthPill,
} from "@/components/admin/admin-ui";
import { Card } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminAiOverview, getAdminKnowledgeStats, getAdminSystemHealth } from "@/lib/services/admin-ai";
import type { AdminAiOverviewDTO, KnowledgeStatsDTO, SystemHealthDTO } from "@/lib/types";

export default function AdminSystemPage() {
  const { t } = useAdminI18n();
  const [health, setHealth] = useState<SystemHealthDTO | null>(null);
  const [ai, setAi] = useState<AdminAiOverviewDTO | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getAdminSystemHealth(), getAdminAiOverview(), getAdminKnowledgeStats()])
      .then(([h, overview, stats]) => {
        setHealth(h);
        setAi(overview);
        setKnowledge(stats);
      })
      .catch(() => {
        setHealth(null);
        setAi(null);
        setKnowledge(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("systemTitle")} description={t("systemDesc")} />

      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <HealthPill ok={!!health?.apiHealthy} label={t("healthApi")} />
            <HealthPill ok={!!health?.databaseHealthy} label={t("healthDatabase")} />
            <HealthPill ok={!!health?.geminiConfigured} label={t("healthGemini")} />
            <HealthPill ok={!!health?.vectorStoreHealthy} label={t("healthVectorStore")} />
          </div>

          {health?.message ? (
            <Card>
              <p className="text-sm text-text-muted">{health.message}</p>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="font-semibold">{t("aiConfiguration")}</h2>
              <p className="text-sm"><span className="text-text-muted">{t("labelProvider")}</span> {ai?.geminiProvider ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">{t("labelModel")}</span> {health?.geminiModel ?? ai?.geminiModel ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">{t("labelVectorStore")}</span> {health?.vectorStoreType ?? "—"}</p>
            </Card>
            <Card className="space-y-3">
              <h2 className="font-semibold">{t("knowledgeIndex")}</h2>
              <p className="text-sm"><span className="text-text-muted">{t("labelDocuments")}</span> {knowledge?.documentCount ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">{t("labelChunks")}</span> {knowledge?.chunkCount ?? "—"}</p>
            </Card>
            <Card className="space-y-3 md:col-span-2">
              <h2 className="font-semibold">{t("fulfillmentWorker")}</h2>
              <p className="text-sm text-text-muted">
                {t("fulfillmentWorkerConfigHintBefore")}
                <code className="rounded bg-surface-2 px-1">OrderFulfillment</code>
                {t("fulfillmentWorkerConfigHintAfter")}
              </p>
              <p className="text-sm text-text-muted">{t("fulfillmentWorkerManualHint")}</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
