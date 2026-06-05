"use client";

import { Suspense, useMemo } from "react";
import { CheckoutFlow } from "@/components/checkout-flow";
import { RecommendedProducts } from "@/components/recommended-products";
import { useAppPreferences } from "@/components/theme-provider";
import { useCart } from "@/lib/cart-context";
import { t } from "@/lib/i18n";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";

function CheckoutContent() {
  const { language, ready } = useAppPreferences();
  const { lineItems } = useCart();
  const excludedIds = useMemo(() => lineItems.map((l) => l.product.id), [lineItems]);
  const cartProductIds = excludedIds;
  const recentProductIds = useMemo(() => getRecentlyViewedIds(), []);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">
        {ready ? t("checkoutTitle", language) : "Checkout"}
      </h1>
      <CheckoutFlow />
      {lineItems.length > 0 ? (
        <RecommendedProducts
          title={ready ? t("checkoutTrending", language) : "Before you pay — picks for you"}
          mode="personalized"
          cartProductIds={cartProductIds}
          recentProductIds={recentProductIds}
          excludedIds={excludedIds}
        />
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Loading checkout…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
