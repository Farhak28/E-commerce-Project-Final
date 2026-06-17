"use client";

import { Card } from "@/components/ui";
import { CompareToggle } from "@/components/compare-toggle";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { BrandOfficialLink } from "@/components/brand-official-link";
import { Badge } from "@/components/ui";
import type { Product } from "@/lib/types";
import { useI18n } from "@/lib/use-i18n";

export function ProductDetailSidebar({ product }: { product: Product }) {
  const { t } = useI18n();
  const inStock = (product.stock ?? 0) > 0;

  return (
    <Card hover={false} className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{product.productBrand}</Badge>
        <Badge tone="default">{product.productType}</Badge>
        {product.reviewCount && product.reviewCount > 0 ? (
          <Badge tone="success">
            {product.rating?.toFixed(1)} ★ ({product.reviewCount})
          </Badge>
        ) : (
          <Badge tone="default">
            <span suppressHydrationWarning>{t("beFirstToReview")}</span>
          </Badge>
        )}
      </div>
      <h1 className="section-title mt-4 text-3xl font-bold md:text-4xl">{product.name}</h1>
      <div className="mt-3">
        <BrandOfficialLink brandName={product.productBrand} officialUrl={product.brandOfficialUrl} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-muted">{product.description}</p>
      <div className="mt-6 flex flex-wrap items-end gap-4 border-b border-border pb-6">
        <p className="text-4xl font-bold text-primary">${product.price}</p>
        <p className={`text-sm font-medium ${inStock ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
          {inStock ? (
            <span suppressHydrationWarning>{t("inStock", { count: product.stock ?? 0 })}</span>
          ) : (
            <span suppressHydrationWarning>{t("outOfStock")}</span>
          )}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <CompareToggle productId={product.id} />
      </div>
      <ProductPurchaseActions productId={product.id} />
    </Card>
  );
}
