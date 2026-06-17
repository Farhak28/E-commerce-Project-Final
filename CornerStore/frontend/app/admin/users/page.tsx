"use client";

import dynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

const AdminUsersManager = dynamic(
  () => import("@/components/admin-users-manager").then((m) => m.AdminUsersManager),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

export default function AdminUsersPage() {
  const { t } = useAdminI18n();
  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("customersTitle")} description={t("customersDesc")} />
      <AdminUsersManager />
    </div>
  );
}
