"use client";

import dynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";

const AdminUsersManager = dynamic(
  () => import("@/components/admin-users-manager").then((m) => m.AdminUsersManager),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Customers" description="Manage customer accounts, roles, and order history." />
      <AdminUsersManager />
    </div>
  );
}
