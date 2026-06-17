"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageHeader, AdminStatCard, AdminTable } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { getAdminProducts } from "@/lib/services/admin";
import type { ProductDTO } from "@/lib/types";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

const LOW_STOCK = 10;

export default function AdminInventoryPage() {
  const { t } = useAdminI18n();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminProducts({ page: 1, pageSize: 500 })
      .then((r) => setProducts(r.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const lowStock = products.filter((p) => (p.stockQuantity ?? 100) <= LOW_STOCK);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("inventoryTitle")} description={t("inventoryDesc")} />
      {loading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatCard label={t("statTotalSkus")} value={products.length} />
            <AdminStatCard label={t("statLowStock")} value={lowStock.length} tone={lowStock.length > 0 ? "warning" : "default"} />
            <AdminStatCard label={t("statInStock")} value={products.length - lowStock.length} tone="success" />
          </div>
          <AdminTable
            columns={[t("colProduct"), t("colCategory"), t("colStock"), t("colPrice"), ""]}
            rows={lowStock.map((p) => [
              p.name,
              p.productType,
              <span key="s" className="font-semibold text-amber-600 dark:text-amber-400">{p.stockQuantity ?? "—"}</span>,
              `$${p.price}`,
              <Link key="e" href="/admin/products" className="text-sm text-primary">{t("editInProducts")}</Link>,
            ])}
            emptyMessage={t("inventoryEmpty")}
          />
        </>
      )}
    </div>
  );
}
