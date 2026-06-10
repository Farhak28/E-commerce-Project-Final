"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Skeleton } from "@/components/ui";
import { OrderTrackingTimeline } from "@/components/order-tracking-timeline";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  advanceAdminOrderTracking,
  getAdminOrderById,
  getAdminOrderTracking,
} from "@/lib/services/admin";
import type { OrderToReturnDTO, OrderTrackingDTO } from "@/lib/types";
import {
  formatFulfillmentStage,
  formatOrderDate,
  formatScheduledDelivery,
  inferPaymentMethodLabel,
} from "@/lib/utils/order-status";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderToReturnDTO | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const loadTracking = useCallback(async (id: string) => {
    try {
      const data = await getAdminOrderTracking(id);
      setTracking(data);
    } catch {
      setTracking(null);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    void getAdminOrderById(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    void loadTracking(id);
  }, [params.id, loadTracking]);

  const handleAdvance = async () => {
    const id = params.id;
    if (!id) return;
    setAdvancing(true);
    try {
      const data = await advanceAdminOrderTracking(id);
      setTracking(data);
      const refreshed = await getAdminOrderById(id);
      setOrder(refreshed);
    } finally {
      setAdvancing(false);
    }
  };

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
        {trackingLoading && !tracking ? (
          <Skeleton className="h-56 w-full" />
        ) : tracking ? (
          <OrderTrackingTimeline
            tracking={tracking}
            onAdvance={handleAdvance}
            advancing={advancing}
          />
        ) : (
          <p className="text-sm text-text-muted">Tracking not available.</p>
        )}
      </Card>

      <Card className="space-y-2 text-sm">
        <p className="text-text-muted">Customer: {order.userEmail}</p>
        <p>
          Payment: {order.paymentMethod ?? inferPaymentMethodLabel(order.paymentIntentId)}
        </p>
        <p>Placed: {formatOrderDate(order.orderDate)}</p>
        <p>Delivery method: {order.deliveryMethod}</p>
        {order.fulfillmentStage ? (
          <p>Fulfillment: {formatFulfillmentStage(order.fulfillmentStage)}</p>
        ) : null}
        {order.trackingNumber ? <p>Tracking ID: {order.trackingNumber}</p> : null}
        {scheduled ? <p>Scheduled delivery: {scheduled}</p> : null}
        {order.returnReason ? (
          <p className="text-text-muted">Return reason: {order.returnReason}</p>
        ) : null}
        <p>Subtotal: ${order.subtotal.toFixed(2)}</p>
        {typeof order.deliveryPrice === "number" ? (
          <p>Delivery: ${order.deliveryPrice.toFixed(2)}</p>
        ) : null}
        {typeof order.discountAmount === "number" && order.discountAmount > 0 ? (
          <p className="text-emerald-700 dark:text-emerald-300">
            Coupon {order.couponCode ? `(${order.couponCode})` : ""}: -${order.discountAmount.toFixed(2)}
          </p>
        ) : null}
        <p className="font-semibold">Total: ${order.total.toFixed(2)}</p>
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

      <Card className="text-sm text-text-muted">
        <p>
          Demo mode: auto-advance runs in the background. Use <strong>Advance step</strong> above for live presentations.
        </p>
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => void loadTracking(params.id!)}>
          Refresh tracking
        </Button>
      </Card>
    </div>
  );
}
