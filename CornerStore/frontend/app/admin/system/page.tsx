"use client";

import { useEffect, useState } from "react";
import {
  AdminLoadingGrid,
  AdminPageHeader,
  AdminStatCard,
  HealthPill,
} from "@/components/admin/admin-ui";
import { Card } from "@/components/ui";
import { getAdminAiOverview, getAdminKnowledgeStats, getAdminSystemHealth } from "@/lib/services/admin-ai";
import type { AdminAiOverviewDTO, KnowledgeStatsDTO, SystemHealthDTO } from "@/lib/types";

export default function AdminSystemPage() {
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
      <AdminPageHeader
        title="System Health"
        description="Monitor API, database, Gemini, and vector indexing pipeline status."
      />

      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <HealthPill ok={!!health?.apiHealthy} label="API" />
            <HealthPill ok={!!health?.databaseHealthy} label="Database" />
            <HealthPill ok={!!health?.geminiConfigured} label="Gemini" />
            <HealthPill ok={!!health?.vectorStoreHealthy} label="Vector store" />
          </div>

          {health?.message ? (
            <Card>
              <p className="text-sm text-text-muted">{health.message}</p>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="font-semibold">AI configuration</h2>
              <p className="text-sm"><span className="text-text-muted">Provider:</span> {ai?.geminiProvider ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">Model:</span> {health?.geminiModel ?? ai?.geminiModel ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">Vector store:</span> {health?.vectorStoreType ?? "—"}</p>
            </Card>
            <Card className="space-y-3">
              <h2 className="font-semibold">Knowledge index</h2>
              <p className="text-sm"><span className="text-text-muted">Documents:</span> {knowledge?.documentCount ?? "—"}</p>
              <p className="text-sm"><span className="text-text-muted">Chunks:</span> {knowledge?.chunkCount ?? "—"}</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
