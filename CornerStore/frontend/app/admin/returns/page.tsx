"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminSearchBar,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Button, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { approveAdminReturn, getAdminReturns, rejectAdminReturn } from "@/lib/services/admin";
import type { OrderToReturnDTO } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils/order-status";
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";

const STATUS_OPTIONS = ["", "ReturnRequested", "Returned"];

export default function AdminReturnsPage() {
  const { t } = useAdminI18n();
  const [returns, setReturns] = useState<OrderToReturnDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ReturnRequested");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actingId, setActingId] = useState<string | null>(null);
  const pageSize = 15;
  const [applied, setApplied] = useState({ search: "", status: "ReturnRequested" });

  const load = useCallback(async (q: string, status: string, p: number) => {
    setLoading(true);
    try {
      const data = await getAdminReturns({
        search: q || undefined,
        status: status || undefined,
        page: p,
        pageSize,
      });
      setReturns(data.items);
      setTotalCount(data.totalCount);
    } catch {
      setReturns([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(applied.search, applied.status, page);
  }, [applied, page, load]);

  const handleApprove = async (id: string) => {
    if (!window.confirm(t("confirmApproveReturn"))) return;
    setActingId(id);
    try {
      await approveAdminReturn(id);
      await load(applied.search, applied.status, page);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm(t("confirmRejectReturn"))) return;
    setActingId(id);
    try {
      await rejectAdminReturn(id);
      await load(applied.search, applied.status, page);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("returnsTitle")} description={t("returnsDesc")} />

      <div className="space-y-4 rounded-2xl border border-border bg-surface/80 p-4">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          onSubmit={() => {
            setPage(1);
            setApplied({ search, status: statusFilter });
          }}
          placeholder={t("searchReturnsPlaceholder")}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">{t("status")}</label>
            <select
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s === "" ? t("allReturns") : s === "ReturnRequested" ? t("pending") : t("completed")}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPage(1);
              setApplied({ search, status: statusFilter });
            }}
          >
            {t("applyFilters")}
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : returns.length === 0 ? (
        <AdminEmptyState title={t("noReturns")} description={t("noReturnsDesc")} />
      ) : (
        <>
          <AdminTable
            columns={[t("colOrder"), t("colCustomer"), t("colReason"), t("colRequested"), t("status"), t("actions")]}
            rows={returns.map((order) => [
              <Link key="o" href={`/admin/orders/${order.id}`} className="font-medium text-accent hover:underline">
                #{order.id.slice(0, 8)}
              </Link>,
              order.userEmail,
              <span key="r" className="line-clamp-2 max-w-xs text-text-muted">
                {order.returnReason ?? "—"}
              </span>,
              order.returnRequestedAt ? formatOrderDate(order.returnRequestedAt) : "—",
              <OrderStatusBadge key="s" status={order.status} />,
              order.status === "ReturnRequested" ? (
                <div key="a" className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actingId === order.id}
                    onClick={() => void handleApprove(order.id)}
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={actingId === order.id}
                    onClick={() => void handleReject(order.id)}
                  >
                    {t("reject")}
                  </Button>
                </div>
              ) : (
                <span key="d" className="text-xs text-text-muted">
                  {t("completed")}
                </span>
              ),
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
