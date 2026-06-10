"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminEmptyState, AdminPageHeader, AdminPagination, AdminSearchBar, AdminTable } from "@/components/admin/admin-ui";
import { Button, Input, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import Link from "next/link";
import { getAdminOrders } from "@/lib/services/admin";
import type { OrderToReturnDTO } from "@/lib/types";
import { formatFulfillmentStage, formatOrderDate } from "@/lib/utils/order-status";

const STATUS_OPTIONS = ["", "Pending", "PaymentReceived", "PaymentFailed", "Cancelled", "ReturnRequested", "Returned"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderToReturnDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;
  const [applied, setApplied] = useState({ email: "", status: "", search: "" });

  const load = useCallback(async (email: string, status: string, q: string, p: number) => {
    setLoading(true);
    try {
      const data = await getAdminOrders({
        userEmail: email || undefined,
        status: status || undefined,
        search: q || undefined,
        page: p,
        pageSize,
      });
      setOrders(data.items);
      setTotalCount(data.totalCount);
    } catch {
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(applied.email, applied.status, applied.search, page);
  }, [applied, page, load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Fulfillment tracking, scheduled delivery pricing, loyalty coupons, and payment status."
      />

      <div className="space-y-4 rounded-2xl border border-border bg-surface/80 p-4">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          onSubmit={() => {
            setPage(1);
            setApplied({ email: emailFilter, status: statusFilter, search });
          }}
          placeholder="Search by email or order ID…"
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-text-muted">Customer email</label>
            <Input
              placeholder="Filter by email…"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-text-muted">Status</label>
            <select
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "All statuses"}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPage(1);
              setApplied({ email: emailFilter, status: statusFilter, search });
            }}
          >
            Apply filters
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : orders.length === 0 ? (
        <AdminEmptyState title="No orders match your filters" />
      ) : (
        <>
          <AdminTable
            columns={["Order", "Customer", "Total", "Fulfillment", "Status", "Date", ""]}
            rows={orders.map((order) => [
              <span key="id" className="font-mono text-xs">{order.id.slice(0, 8)}…</span>,
              order.userEmail,
              <span key="total">
                ${order.total.toFixed(2)}
                {order.discountAmount ? (
                  <span className="block text-xs text-emerald-600">-${order.discountAmount.toFixed(2)}</span>
                ) : null}
              </span>,
              order.fulfillmentStage ? formatFulfillmentStage(order.fulfillmentStage) : "—",
              <OrderStatusBadge key="status" status={order.status} paymentMethod={order.paymentMethod} />,
              formatOrderDate(order.orderDate),
              <Link key="view" href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-primary">
                View
              </Link>,
            ])}
          />
          <AdminPagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
