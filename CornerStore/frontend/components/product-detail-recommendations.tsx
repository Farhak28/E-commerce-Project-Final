"use client";

import { RecommendedProducts } from "@/components/recommended-products";
import { useI18n } from "@/lib/use-i18n";

export function ProductDetailRecommendations({ productId }: { productId: number }) {
  const { t } = useI18n();

  return (
    <>
      <RecommendedProducts
        title={t("customersAlsoBought")}
        productId={productId}
        mode="bought-together"
        excludedIds={[productId]}
      />
      <RecommendedProducts
        title={t("similarProducts")}
        productId={productId}
        mode="similar-price"
        excludedIds={[productId]}
      />
      <RecommendedProducts
        title={t("frequentlyBoughtTogether")}
        productId={productId}
        mode="cart"
        cartProductIds={[productId]}
        excludedIds={[productId]}
      />
    </>
  );
}
