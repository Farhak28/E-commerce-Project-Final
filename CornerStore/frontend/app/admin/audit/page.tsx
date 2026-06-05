"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminPagination, AdminSearchBar, AdminTable } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { getAdminAuditLogs } from "@/lib/services/admin";
import type { AuditLogDTO } from "@/lib/types";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminAuditLogs(page, pageSize, appliedSearch || undefined);
      setLogs(data.items);
      setTotalCount(data.totalCount);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit Logs" description="Track admin changes to products, users, orders, knowledge base, and AI configuration." />
      <AdminSearchBar value={search} onChange={setSearch} onSubmit={() => { setPage(1); setAppliedSearch(search); }} placeholder="Search actor, action, entity…" />
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <>
          <AdminTable
            columns={["When", "Actor", "Action", "Entity", "Details"]}
            rows={logs.map((l) => [
              new Date(l.createdAt).toLocaleString(),
              l.actorEmail,
              l.action,
              `${l.entityType}${l.entityId ? ` #${l.entityId}` : ""}`,
              <span key="d" className="line-clamp-2 max-w-sm text-text-muted">{l.details ?? "—"}</span>,
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
