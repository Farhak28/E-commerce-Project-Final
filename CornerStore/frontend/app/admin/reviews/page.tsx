"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader, AdminPagination, AdminSearchBar, AdminTable } from "@/components/admin/admin-ui";
import { Button, Skeleton } from "@/components/ui";
import { deleteAdminReview, getAdminReviews } from "@/lib/services/admin";
import type { AdminReviewDTO } from "@/lib/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews({ search: appliedSearch || undefined, page, pageSize });
      setReviews(data.items);
      setTotalCount(data.totalCount);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this review?")) return;
    await deleteAdminReview(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reviews" description="Moderate product reviews submitted by customers." />
      <AdminSearchBar value={search} onChange={setSearch} onSubmit={() => { setPage(1); setAppliedSearch(search); }} placeholder="Search product, user, or comment…" />
      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <>
          <AdminTable
            columns={["Product", "User", "Rating", "Comment", "Date", ""]}
            rows={reviews.map((r) => [
              r.productName,
              r.userName,
              `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`,
              <span key="c" className="line-clamp-2 max-w-xs">{r.comment}</span>,
              new Date(r.createdAt).toLocaleDateString(),
              <Button key="d" type="button" variant="ghost" onClick={() => void handleDelete(r.id)}>Delete</Button>,
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
