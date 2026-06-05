"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { getAdminOrderById } from "@/lib/services/admin";
import type { OrderToReturnDTO } from "@/lib/types";
import { formatOrderDate, formatScheduledDelivery, inferPaymentMethodLabel } from "@/lib/utils/order-status";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderToReturnDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    void getAdminOrderById(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!order) return <p className="text-sm text-text-muted">Order not found.</p>;

  const scheduled = formatScheduledDelivery(order.scheduledDeliveryAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
        <OrderStatusBadge
          status={order.status}
          paymentMethod={order.paymentMethod}
          paymentIntentId={order.paymentIntentId}
        />
      </div>
      <Card>
        <p className="text-sm text-text-muted">Customer: {order.userEmail}</p>
        <p className="mt-1 text-sm">
          Payment: {order.paymentMethod ?? inferPaymentMethodLabel(order.paymentIntentId)}
        </p>
        <p className="mt-1 text-sm">Placed: {formatOrderDate(order.orderDate)}</p>
        {scheduled ? <p className="mt-1 text-sm">Scheduled: {scheduled}</p> : null}
        {order.returnReason ? (
          <p className="mt-1 text-sm text-text-muted">Return reason: {order.returnReason}</p>
        ) : null}
        <p className="mt-1 text-sm font-semibold">Total: ${order.total.toFixed(2)}</p>
      </Card>
      <Card>
        <h2 className="section-title text-lg font-semibold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between gap-2">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
