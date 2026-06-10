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
import { getAdminAiOverview } from "@/lib/services/admin-ai";
import { getAdminKnowledgeStats } from "@/lib/services/admin-ai";
import type { AdminAiOverviewDTO, KnowledgeStatsDTO } from "@/lib/types";

export default function AdminAiOverviewPage() {
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
        setError(e instanceof Error ? e.message : "Failed to load AI overview");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Management"
        description="Monitor the shopping assistant, knowledge base, and Gemini integration."
        actions={
          <Link href="/admin/ai/knowledge">
            <Button type="button">Manage knowledge</Button>
          </Link>
        }
      />

      {error ? (
        <Card className="border-accent/40 bg-accent/5">
          <p className="text-sm font-semibold text-accent">Could not load AI data</p>
          <p className="mt-1 text-sm text-text-muted">{error}</p>
          <p className="mt-2 text-xs text-text-muted">
            Sign in as Admin/SuperAdmin, ensure the API is running, and apply database migrations
            (AI tables: KnowledgeDocuments, KnowledgeChunks, AssistantInteractionLogs).
          </p>
        </Card>
      ) : null}

      {loading ? (
        <AdminLoadingGrid count={6} />
      ) : !error ? (
        <>
          <div className="flex flex-wrap gap-2">
            <HealthPill ok={!!ai?.geminiConfigured} label={ai?.geminiConfigured ? "Gemini connected" : "Gemini not configured"} />
            <HealthPill ok={(knowledge?.documentCount ?? 0) > 0} label={`${knowledge?.documentCount ?? 0} knowledge docs`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard label="Total conversations" value={ai?.totalConversations ?? "—"} hint={`${ai?.conversationsToday ?? 0} today`} />
            <AdminStatCard label="Unique sessions" value={ai?.uniqueSessions ?? "—"} />
            <AdminStatCard label="Avg latency" value={ai ? `${Math.round(ai.averageLatencyMs)} ms` : "—"} />
            <AdminStatCard label="Knowledge documents" value={knowledge?.documentCount ?? "—"} />
            <AdminStatCard label="Indexed chunks" value={knowledge?.chunkCount ?? "—"} />
            <AdminStatCard label="Model" value={ai?.geminiModel ?? "—"} hint={ai?.geminiProvider ?? undefined} />
          </div>

          <Card>
            <h2 className="font-semibold">Quick links</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/ai/knowledge" className="text-sm font-semibold text-primary">Knowledge Base →</Link>
              <Link href="/admin/ai/analytics" className="text-sm font-semibold text-primary">Chat Analytics →</Link>
              <Link href="/admin/ai/logs" className="text-sm font-semibold text-primary">Conversation Logs →</Link>
              <Link href="/admin/system" className="text-sm font-semibold text-primary">System Health →</Link>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
