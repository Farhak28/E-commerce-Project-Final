"use client";

import dynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";

const AdminProductsManager = dynamic(
  () => import("@/components/admin-products-manager").then((m) => m.AdminProductsManager),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-2xl" />,
  },
);

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Products" description="Manage catalog items, pricing, images, brands, and categories." />
      <AdminProductsManager />
    </div>
  );
}
