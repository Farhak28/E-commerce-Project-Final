"use client";

import { getOrderStatusMeta, orderStatusBadgeClass } from "@/lib/utils/order-status";

type Props = {
  status: string;
  paymentMethod?: string | null;
  paymentIntentId?: string;
};

export function OrderStatusBadge({ status, paymentMethod, paymentIntentId }: Props) {
  const meta = getOrderStatusMeta(status, paymentMethod, paymentIntentId);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${orderStatusBadgeClass(meta.tone)}`}
      title={meta.description || undefined}
    >
      {meta.label}
    </span>
  );
}
