"use client";

import { useEffect, useState } from "react";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { getAdminVisualSearchAnalytics } from "@/lib/services/admin-ai";
import type { VisualSearchAnalytics } from "@/lib/types/visual-search";

export default function AdminVisualSearchPage() {
  const [data, setData] = useState<VisualSearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminVisualSearchAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Visual Search Analytics"
        description="Gemini Vision uploads, match success, and detected categories."
      />
      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Total visual searches" value={data?.totalSearches ?? 0} />
            <AdminStatCard label="Searches today" value={data?.searchesToday ?? 0} />
            <AdminStatCard
              label="Match success rate"
              value={data ? `${data.matchSuccessRate}%` : "—"}
              hint="Exact or similar results returned"
            />
            <AdminStatCard label="Days tracked" value={data?.searchesByDay.length ?? 0} />
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Searches per day</h2>
            <AdminTable
              columns={["Date", "Searches"]}
              rows={(data?.searchesByDay ?? []).map((d) => [d.date, d.count])}
              emptyMessage="No visual searches yet. Uploads from chat or /visual-search appear here."
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Top uploaded categories</h2>
            <AdminTable
              columns={["Category", "Count"]}
              rows={(data?.topCategories ?? []).map((c) => [c.category, c.count])}
              emptyMessage="No category data yet."
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Top detected brands</h2>
            <AdminTable
              columns={["Brand", "Count"]}
              rows={(data?.topBrands ?? []).map((b) => [b.category, b.count])}
              emptyMessage="No brand data yet."
            />
          </section>
        </>
      )}
    </div>
  );
}
