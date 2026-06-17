"use client";

import Link from "next/link";
import type { OrderItemDTO } from "@/lib/types";
import { useI18n } from "@/lib/use-i18n";

type OrderReviewPromptProps = {
  orderId: string;
  items: OrderItemDTO[];
};

export function OrderReviewPrompt({ orderId, items }: OrderReviewPromptProps) {
  const { t } = useI18n();
  const reviewable = items.filter((item) => item.productId > 0);
  if (reviewable.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <h2 className="section-title text-lg font-semibold" suppressHydrationWarning>
        {t("reviewOrderTitle")}
      </h2>
      <p className="mt-1 text-sm text-text-muted" suppressHydrationWarning>
        {t("reviewOrderDesc")}
      </p>
      <ul className="mt-4 space-y-2">
        {reviewable.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm"
          >
            <span>
              {item.productName}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <Link
              href={`/products/${item.productId}#product-reviews`}
              className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              suppressHydrationWarning
            >
              {t("rateAndReview")}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-text-muted" suppressHydrationWarning>
        {t("orderNumber", { id: orderId.slice(0, 8) })}
      </p>
    </div>
  );
}
