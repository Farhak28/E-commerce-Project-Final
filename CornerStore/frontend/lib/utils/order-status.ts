import { t, type Language } from "@/lib/i18n";

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

export function inferPaymentMethodLabel(
  paymentIntentId: string,
  lang: Language = "en",
): string {
  if (paymentIntentId.startsWith("cod-")) return t("payCod", lang);
  if (paymentIntentId.startsWith("instapay-")) return t("payInstaPay", lang);
  return t("payCardWallet", lang);
}

export function isOfflinePaymentOrder(
  status: string,
  paymentMethod?: string | null,
  paymentIntentId?: string,
  lang: Language = "en",
): boolean {
  const label =
    paymentMethod ?? (paymentIntentId ? inferPaymentMethodLabel(paymentIntentId, lang) : "");
  const lower = label.toLowerCase();
  return status === "Pending" && (lower.includes("cash") || lower.includes("instapay"));
}

export function getOrderStatusMeta(
  status: string,
  paymentMethod?: string | null,
  paymentIntentId?: string,
  lang: Language = "en",
): OrderStatusMeta {
  const pm =
    paymentMethod ?? (paymentIntentId ? inferPaymentMethodLabel(paymentIntentId, lang) : null);

  if (status === "Pending" && pm) {
    const lower = pm.toLowerCase();
    if (lower.includes("cash on delivery") || lower.includes("instapay")) {
      return {
        label: t("statusOrderMade", lang),
        description: lower.includes("instapay")
          ? t("statusInstaPayDesc", lang)
          : t("statusCodDesc", lang),
        tone: "success",
      };
    }
  }

  const map: Record<string, OrderStatusMeta> = {
    Pending: {
      label: t("statusAwaitingPayment", lang),
      description: t("statusAwaitingPaymentDesc", lang),
      tone: "warning",
    },
    PaymentReceived: {
      label: t("statusOrderConfirmed", lang),
      description: t("statusOrderConfirmedDesc", lang),
      tone: "success",
    },
    PaymentFailed: {
      label: t("statusPaymentFailed", lang),
      description: t("statusPaymentFailedDesc", lang),
      tone: "danger",
    },
    Cancelled: {
      label: t("statusCancelled", lang),
      description: t("statusCancelledDesc", lang),
      tone: "neutral",
    },
    ReturnRequested: {
      label: t("statusReturnRequested", lang),
      description: t("statusReturnRequestedDesc", lang),
      tone: "warning",
    },
    Returned: {
      label: t("statusReturned", lang),
      description: t("statusReturnedDesc", lang),
      tone: "neutral",
    },
  };

  return (
    map[status] ?? {
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

export function formatOrderDate(iso: string, lang: Language = "en"): string {
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatScheduledDelivery(
  iso: string | null | undefined,
  lang: Language = "en",
): string | null {
  if (!iso) return null;
  return formatOrderDate(iso, lang);
}

const FULFILLMENT_KEYS: Record<string, Parameters<typeof t>[0]> = {
  OrderPlaced: "stageOrderPlaced",
  Confirmed: "stageConfirmed",
  Processing: "stageProcessing",
  Shipped: "stageShipped",
  OutForDelivery: "stageOutForDelivery",
  Delivered: "stageDelivered",
  Cancelled: "stageCancelled",
  ReturnRequested: "stageReturnRequested",
  Returned: "stageReturned",
};

export function formatFulfillmentStage(stage: string, lang: Language = "en"): string {
  const key = FULFILLMENT_KEYS[stage];
  return key ? t(key, lang) : stage.replace(/([A-Z])/g, " $1").trim();
}

export function formatTrackingTimestamp(iso: string, lang: Language = "en"): string {
  return formatOrderDate(iso, lang);
}

export function fulfillmentTone(stage: string): OrderStatusMeta["tone"] {
  if (stage === "Delivered") return "success";
  if (stage === "Cancelled" || stage === "Returned") return "neutral";
  if (stage === "ReturnRequested") return "warning";
  if (stage === "OutForDelivery" || stage === "Shipped") return "success";
  return "warning";
}
