"use client";



import { useEffect, useState } from "react";

import { AdminPageHeader, AdminStatCard, HealthPill } from "@/components/admin/admin-ui";

import { Card, Skeleton } from "@/components/ui";

import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

import { getAdminAiConfig, getAdminAiCost } from "@/lib/services/admin-ai";

import { adminFeatures } from "@/lib/admin/i18n";

import type { AiConfigDTO, AiCostSummaryDTO } from "@/lib/types";



export default function AdminAiConfigPage() {

  const { t } = useAdminI18n();

  const [config, setConfig] = useState<AiConfigDTO | null>(null);

  const [cost, setCost] = useState<AiCostSummaryDTO | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    void Promise.all([getAdminAiConfig(), getAdminAiCost()])

      .then(([c, co]) => {

        setConfig(c);

        setCost(co);

      })

      .catch(() => {

        setConfig(null);

        setCost(null);

      })

      .finally(() => setLoading(false));

  }, []);



  return (

    <div className="space-y-6">

      <AdminPageHeader title={t("configTitle")} description={t("configDesc")} />

      {loading ? (

        <Skeleton className="h-64 w-full rounded-2xl" />

      ) : (

        <>

          <div className="flex flex-wrap gap-2">

            <HealthPill

              ok={config?.geminiConfigured ?? false}

              label={config?.geminiConfigured ? t("geminiConnected") : t("geminiNotConfigured")}

            />

            <HealthPill

              ok={adminFeatures.multiAiProvider}

              label={`${t("providers")} ${adminFeatures.supportedAiProviders.join(", ")}`}

            />

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <Card className="space-y-2 text-sm">

              <h2 className="font-semibold">{t("modelSettings")}</h2>

              <p><span className="text-text-muted">{t("labelProviderName")}</span> {config?.provider}</p>

              <p><span className="text-text-muted">{t("labelChatModel")}</span> {config?.modelName}</p>

              <p><span className="text-text-muted">{t("labelEmbeddingModel")}</span> {config?.embeddingModelName}</p>

              <p><span className="text-text-muted">{t("labelTemperature")}</span> {config?.temperature}</p>

              <p><span className="text-text-muted">{t("labelMaxToolIterations")}</span> {config?.maxToolIterations}</p>

            </Card>

            <Card className="space-y-2 text-sm">

              <h2 className="font-semibold">{t("ragSettings")}</h2>

              <p><span className="text-text-muted">{t("labelChunkSize")}</span> {config?.chunkSize} {t("labelChars")}</p>

              <p><span className="text-text-muted">{t("labelTopK")}</span> {config?.topKRetrieval}</p>

              <p><span className="text-text-muted">{t("labelHistoryLength")}</span> {config?.historyLength} {t("labelMessages")}</p>

              <p>

                <span className="text-text-muted">{t("labelStartupIndexing")}</span>{" "}

                {config?.enableStartupIndexing ? t("enabled") : t("disabled")}

              </p>

            </Card>

            <Card className="space-y-2 text-sm md:col-span-2">

              <h2 className="font-semibold">{t("systemPrompt")}</h2>

              <p className="text-text-muted">{config?.systemPromptSummary}</p>

              <p className="mt-2 text-xs text-text-muted">{t("geminiKeyHintProduction")}</p>

            </Card>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <AdminStatCard label={t("statPromptTokens")} value={cost?.totalPromptTokens.toLocaleString() ?? "—"} />

            <AdminStatCard label={t("statResponseTokens")} value={cost?.totalResponseTokens.toLocaleString() ?? "—"} />

            <AdminStatCard label={t("statEstCost")} value={cost ? `$${cost.estimatedCostUsd.toFixed(4)}` : "—"} />

            <AdminStatCard label={t("statLoggedConversations")} value={cost?.conversationsWithTokens ?? "—"} />

          </div>

        </>

      )}

    </div>

  );

}

