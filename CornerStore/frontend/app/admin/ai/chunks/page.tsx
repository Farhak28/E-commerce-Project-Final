"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminPagination, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { Card, Skeleton } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminKnowledgeStats } from "@/lib/services/admin-ai";
import { getKnowledgeChunks } from "@/lib/services/knowledge";
import type { KnowledgeChunkDTO, KnowledgeStatsDTO } from "@/lib/types";

export default function AdminChunksPage() {
  const { t } = useAdminI18n();
  const [chunks, setChunks] = useState<KnowledgeChunkDTO[]>([]);
  const [stats, setStats] = useState<KnowledgeStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [chunkData, statsData] = await Promise.all([
        getKnowledgeChunks(undefined, page, pageSize),
        getAdminKnowledgeStats(),
      ]);
      setChunks(chunkData.items);
      setTotalCount(chunkData.totalCount);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setChunks([]);
      setError(err instanceof Error ? err.message : t("failedToLoadChunksData"));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("chunksTitle")} description={t("chunksDescExtended")} />
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard label={t("statDocuments")} value={stats?.documentCount ?? "—"} />
        <AdminStatCard label={t("statTotalChunks")} value={stats?.chunkCount ?? "—"} />
        <AdminStatCard
          label={t("labelLastUpdated")}
          value={stats?.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleDateString() : "—"}
        />
      </div>
      {error ? (
        <Card className="border-accent/40 bg-accent/5">
          <p className="text-sm font-semibold text-accent">{t("couldNotLoadChunks")}</p>
          <p className="mt-1 text-sm text-text-muted">{error}</p>
        </Card>
      ) : null}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : !error ? (
        <>
          <AdminTable
            columns={[t("colDocument"), t("colIndex"), t("colPreview"), t("colEmbedded"), t("colCreated")]}
            rows={chunks.map((c) => [
              c.documentTitle,
              `#${c.chunkIndex}`,
              <span key="t" className="line-clamp-2 max-w-md text-text-muted">{c.textPreview}</span>,
              c.hasEmbedding ? t("yes") : t("no"),
              new Date(c.createdAt).toLocaleDateString(),
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
