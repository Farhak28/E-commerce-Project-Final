"use client";

import { useEffect, useState } from "react";
import { AdminLoadingGrid, AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminVisualSearchAnalytics } from "@/lib/services/admin-ai";
import type { VisualSearchAnalytics } from "@/lib/types/visual-search";

export default function AdminVisualSearchPage() {
  const { t } = useAdminI18n();
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
      <AdminPageHeader title={t("visualSearchTitle")} description={t("visualSearchDescExtended")} />
      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label={t("statTotalVisualSearches")} value={data?.totalSearches ?? 0} />
            <AdminStatCard label={t("statSearchesToday")} value={data?.searchesToday ?? 0} />
            <AdminStatCard
              label={t("statMatchSuccessRate")}
              value={data ? `${data.matchSuccessRate}%` : "—"}
              hint={t("statExactOrSimilar")}
            />
            <AdminStatCard label={t("statDaysTracked")} value={data?.searchesByDay.length ?? 0} />
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("searchesPerDay")}</h2>
            <AdminTable
              columns={[t("colDate"), t("colSearches")]}
              rows={(data?.searchesByDay ?? []).map((d) => [d.date, d.count])}
              emptyMessage={t("noVisualSearchesYet")}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("topUploadedCategories")}</h2>
            <AdminTable
              columns={[t("colCategory"), t("colCount")]}
              rows={(data?.topCategories ?? []).map((c) => [c.category, c.count])}
              emptyMessage={t("noCategoryDataYet")}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{t("topDetectedBrands")}</h2>
            <AdminTable
              columns={[t("colBrand"), t("colCount")]}
              rows={(data?.topBrands ?? []).map((b) => [b.category, b.count])}
              emptyMessage={t("noBrandDataYet")}
            />
          </section>
        </>
      )}
    </div>
  );
}
