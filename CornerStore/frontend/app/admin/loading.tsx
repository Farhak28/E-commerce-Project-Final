import { AdminLoadingGrid } from "@/components/admin/admin-ui";

export default function AdminLoading() {
  return (
    <div className="space-y-6 py-4">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-2" />
      <AdminLoadingGrid count={6} />
    </div>
  );
}
