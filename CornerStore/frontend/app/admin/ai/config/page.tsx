"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, AdminStatCard, HealthPill } from "@/components/admin/admin-ui";
import { Card, Skeleton } from "@/components/ui";
import { getAdminAiConfig, getAdminAiCost } from "@/lib/services/admin-ai";
import { adminFeatures } from "@/lib/admin/i18n";
import type { AiConfigDTO, AiCostSummaryDTO } from "@/lib/types";

export default function AdminAiConfigPage() {
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
      <AdminPageHeader
        title="AI Configuration"
        description="View model settings, RAG parameters, and estimated API costs. Runtime secrets are configured via environment variables."
      />
      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <HealthPill ok={config?.geminiConfigured ?? false} label={config?.geminiConfigured ? "Gemini connected" : "Gemini not configured"} />
            <HealthPill ok={adminFeatures.multiAiProvider} label={`Providers: ${adminFeatures.supportedAiProviders.join(", ")}`} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-2 text-sm">
              <h2 className="font-semibold">Model settings</h2>
              <p><span className="text-text-muted">Provider:</span> {config?.provider}</p>
              <p><span className="text-text-muted">Chat model:</span> {config?.modelName}</p>
              <p><span className="text-text-muted">Embedding model:</span> {config?.embeddingModelName}</p>
              <p><span className="text-text-muted">Temperature:</span> {config?.temperature}</p>
              <p><span className="text-text-muted">Max tool iterations:</span> {config?.maxToolIterations}</p>
            </Card>
            <Card className="space-y-2 text-sm">
              <h2 className="font-semibold">RAG settings</h2>
              <p><span className="text-text-muted">Chunk size:</span> {config?.chunkSize} chars</p>
              <p><span className="text-text-muted">Top-K retrieval:</span> {config?.topKRetrieval}</p>
              <p><span className="text-text-muted">History length:</span> {config?.historyLength} messages</p>
              <p><span className="text-text-muted">Startup indexing:</span> {config?.enableStartupIndexing ? "Enabled" : "Disabled"}</p>
            </Card>
            <Card className="space-y-2 text-sm md:col-span-2">
              <h2 className="font-semibold">System prompt</h2>
              <p className="text-text-muted">{config?.systemPromptSummary}</p>
              <p className="mt-2 text-xs text-text-muted">Set GEMINI_API_KEY in .env to enable the assistant in production.</p>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Prompt tokens" value={cost?.totalPromptTokens.toLocaleString() ?? "—"} />
            <AdminStatCard label="Response tokens" value={cost?.totalResponseTokens.toLocaleString() ?? "—"} />
            <AdminStatCard label="Est. cost (USD)" value={cost ? `$${cost.estimatedCostUsd.toFixed(4)}` : "—"} />
            <AdminStatCard label="Logged conversations" value={cost?.conversationsWithTokens ?? "—"} />
          </div>
        </>
      )}
    </div>
  );
}
