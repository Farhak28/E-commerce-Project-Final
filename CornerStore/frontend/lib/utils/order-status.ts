export type OrderStatusKey =
  | "Pending"
  | "PaymentReceived"
  | "PaymentFailed"
  | "Cancelled"
  | "ReturnRequested"
  | "Returned"
  | string;

export type OrderStatusMeta = {
  label: string;
  description: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

const STATUS_META: Record<string, OrderStatusMeta> = {
  Pending: {
    label: "Awaiting payment",
    description: "Your order is placed. Complete payment to confirm.",
    tone: "warning",
  },
  PaymentReceived: {
    label: "Order confirmed",
    description: "Payment received. We're preparing your order.",
    tone: "success",
  },
  PaymentFailed: {
    label: "Payment failed",
    description: "Payment did not go through. Try checkout again.",
    tone: "danger",
  },
  Cancelled: {
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "neutral",
  },
  ReturnRequested: {
    label: "Return requested",
    description: "We received your return request and will follow up.",
    tone: "warning",
  },
  Returned: {
    label: "Returned",
    description: "This order has been returned.",
    tone: "neutral",
  },
};

export function inferPaymentMethodLabel(paymentIntentId: string): string {
  if (paymentIntentId.startsWith("cod-")) return "Cash on delivery";
  if (paymentIntentId.startsWith("instapay-")) return "InstaPay";
  return "Card / wallet";
}

export function isOfflinePaymentOrder(status: string, paymentMethod?: string | null, paymentIntentId?: string): boolean {
  const label = paymentMethod ?? (paymentIntentId ? inferPaymentMethodLabel(paymentIntentId) : "");
  const lower = label.toLowerCase();
  return status === "Pending" && (lower.includes("cash") || lower.includes("instapay"));
}

export function getOrderStatusMeta(
  status: string,
  paymentMethod?: string | null,
  paymentIntentId?: string,
): OrderStatusMeta {
  const pm = paymentMethod ?? (paymentIntentId ? inferPaymentMethodLabel(paymentIntentId) : null);

  if (status === "Pending" && pm) {
    const lower = pm.toLowerCase();
    if (lower.includes("cash on delivery") || lower.includes("instapay")) {
      return {
        label: "Order made",
        description: lower.includes("instapay")
          ? "Your order is placed. Complete InstaPay when ready."
          : "Your order is placed. Pay cash on delivery when it arrives.",
        tone: "success",
      };
    }
  }

  return (
    STATUS_META[status] ?? {
      label: status.replace(/([A-Z])/g, " $1").trim(),
      description: "",
      tone: "neutral" as const,
    }
  );
}

export function orderStatusBadgeClass(tone: OrderStatusMeta["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "warning":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
    case "danger":
      return "bg-red-500/15 text-red-700 dark:text-red-300";
    default:
      return "bg-surface-2 text-text-muted";
  }
}

export function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatScheduledDelivery(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return formatOrderDate(iso);
}
