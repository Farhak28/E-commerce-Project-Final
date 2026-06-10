"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Skeleton } from "@/components/ui";
import { OrderActions } from "@/components/order-actions";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTrackingTimeline } from "@/components/order-tracking-timeline";
import { advanceOrderTracking, getOrderById, getOrderTracking } from "@/lib/services/orders";
import type { OrderToReturnDTO, OrderTrackingDTO } from "@/lib/types";
import { formatAddressLine } from "@/lib/utils/address";
import { formatOrderDate, formatScheduledDelivery, inferPaymentMethodLabel } from "@/lib/utils/order-status";

const TRACKING_POLL_MS = 30_000;

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderToReturnDTO | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const loadTracking = useCallback(async (id: string) => {
    try {
      const data = await getOrderTracking(id);
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

    void getOrderById(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    void loadTracking(id);
    const timer = window.setInterval(() => {
      void loadTracking(id);
    }, TRACKING_POLL_MS);

    return () => window.clearInterval(timer);
  }, [params.id, loadTracking]);

  const handleAdvance = async () => {
    const id = params.id;
    if (!id) return;
    setAdvancing(true);
    try {
      const data = await advanceOrderTracking(id);
      setTracking(data);
      const refreshed = await getOrderById(id);
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
          <OrderTrackingTimeline tracking={tracking} onAdvance={handleAdvance} advancing={advancing} />
        ) : (
          <p className="text-sm text-text-muted">Tracking is not available for this order yet.</p>
        )}
      </Card>

      <Card className="space-y-2">
        <p className="text-sm text-text-muted">Placed {formatOrderDate(order.orderDate)}</p>
        <p className="text-sm">
          Payment: {order.paymentMethod ?? inferPaymentMethodLabel(order.paymentIntentId)}
        </p>
        <p className="text-sm">Delivery method: {order.deliveryMethod}</p>
        {scheduled ? (
          <p className="text-sm">Scheduled for: {scheduled}</p>
        ) : null}
        <p className="text-sm">
          Subtotal: ${order.subtotal.toFixed(2)}
          {typeof order.deliveryPrice === "number" ? (
            <>
              <br />
              Delivery: ${order.deliveryPrice.toFixed(2)}
              {order.scheduledDeliveryAt ? (
                <span className="text-text-muted"> (scheduled slot)</span>
              ) : null}
            </>
          ) : null}
        </p>
        {typeof order.discountAmount === "number" && order.discountAmount > 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Coupon {order.couponCode ? `(${order.couponCode})` : ""}: -${order.discountAmount.toFixed(2)}
          </p>
        ) : null}
        <p className="text-sm font-semibold">Total: ${order.total.toFixed(2)}</p>
      </Card>

      <Card>
        <h2 className="section-title text-lg font-semibold">Shipping address</h2>
        <p className="mt-2 text-sm text-text-muted">
          {order.address.firstName} {order.address.lastName}
          <br />
          {formatAddressLine(order.address)}
        </p>
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

      <Card>
        <h2 className="section-title text-lg font-semibold">Manage order</h2>
        <div className="mt-3">
          <OrderActions order={order} onUpdated={setOrder} />
        </div>
      </Card>
    </div>
  );
}
