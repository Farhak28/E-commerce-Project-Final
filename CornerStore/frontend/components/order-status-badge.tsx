"use client";

import { useI18n } from "@/lib/use-i18n";
import { getOrderStatusMeta, orderStatusBadgeClass } from "@/lib/utils/order-status";

type Props = {
  status: string;
  paymentMethod?: string | null;
  paymentIntentId?: string;
};

export function OrderStatusBadge({ status, paymentMethod, paymentIntentId }: Props) {
  const { language } = useI18n();
  const meta = getOrderStatusMeta(status, paymentMethod, paymentIntentId, language);
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${orderStatusBadgeClass(meta.tone)}`}
      title={meta.description || undefined}
    >
      {meta.label}
    </span>
  );
}
