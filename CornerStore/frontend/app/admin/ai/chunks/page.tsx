"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminPagination, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { getAdminKnowledgeStats } from "@/lib/services/admin-ai";
import { getKnowledgeChunks } from "@/lib/services/knowledge";
import type { KnowledgeChunkDTO, KnowledgeStatsDTO } from "@/lib/types";

export default function AdminChunksPage() {
  const [chunks, setChunks] = useState<KnowledgeChunkDTO[]>([]);
  const [stats, setStats] = useState<KnowledgeStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch {
      setChunks([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Chunk Viewer" description="Browse RAG knowledge chunks, embedding status, and source documents." />
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Documents" value={stats?.documentCount ?? "—"} />
        <AdminStatCard label="Total chunks" value={stats?.chunkCount ?? "—"} />
        <AdminStatCard label="Last updated" value={stats?.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleDateString() : "—"} />
      </div>
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <>
          <AdminTable
            columns={["Document", "Index", "Preview", "Embedded", "Created"]}
            rows={chunks.map((c) => [
              c.documentTitle,
              `#${c.chunkIndex}`,
              <span key="t" className="line-clamp-2 max-w-md text-text-muted">{c.textPreview}</span>,
              c.hasEmbedding ? "Yes" : "No",
              new Date(c.createdAt).toLocaleDateString(),
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
