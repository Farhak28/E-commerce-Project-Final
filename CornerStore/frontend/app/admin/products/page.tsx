"use client";

import dynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

const AdminProductsManager = dynamic(
  () => import("@/components/admin-products-manager").then((m) => m.AdminProductsManager),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

export default function AdminProductsPage() {
  const { t } = useAdminI18n();
  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("productsTitle")} description={t("productsDesc")} />
      <AdminProductsManager />
    </div>
  );
}
