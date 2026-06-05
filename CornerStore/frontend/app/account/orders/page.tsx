"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { useAuth } from "@/lib/auth-context";
import { getOrders } from "@/lib/services/orders";
import type { OrderToReturnDTO } from "@/lib/types";
import { formatOrderDate } from "@/lib/utils/order-status";

function OrderHistoryContent() {
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderToReturnDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const justPlaced = searchParams.get("placed") === "1";

  useEffect(() => {
    if (!isSignedIn) {
      setOrders([]);
      setLoading(false);
      return;
    }
    void getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <Card>
        <p className="text-sm text-text-muted">Sign in to view your Corner Store orders.</p>
        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary">
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">Order History</h1>
      {justPlaced ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          Your order was placed successfully.
        </p>
      ) : null}
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : orders.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">No orders yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                  <OrderStatusBadge
                    status={order.status}
                    paymentMethod={order.paymentMethod}
                    paymentIntentId={order.paymentIntentId}
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">{formatOrderDate(order.orderDate)}</p>
                <p className="mt-2 text-sm font-semibold">${order.total.toFixed(2)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <OrderHistoryContent />
    </Suspense>
  );
}
