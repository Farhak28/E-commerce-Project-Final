import { Card } from "@/components/ui";
import { CompareToggle } from "@/components/compare-toggle";
import { ProductPurchaseActions } from "@/components/product-purchase-actions";
import { ProductDetailsTabs } from "@/components/product-details-tabs";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { ProductGallery } from "@/components/product-gallery";
import { ProductAiInsights } from "@/components/product-ai-insights";
import { RecommendedProducts } from "@/components/recommended-products";
import { Badge } from "@/components/ui";
import { getProductByIdServer } from "@/lib/services/products";
import { mapProductDTO } from "@/lib/utils/product";
import { notFound } from "next/navigation";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  let product;
  try {
    const dto = await getProductByIdServer(numericId);
    product = mapProductDTO(dto);
  } catch {
    notFound();
  }

  const inStock = (product.stock ?? 0) > 0;

  return (
    <div className="space-y-10">
      <ProductViewTracker productId={product.id} />

      <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery product={product} />
        <Card hover={false} className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{product.productBrand}</Badge>
            <Badge tone="default">{product.productType}</Badge>
            {product.rating ? (
              <Badge tone="success">{product.rating.toFixed(1)} ★ ({product.reviewCount ?? 0})</Badge>
            ) : null}
          </div>
          <h1 className="section-title mt-4 text-3xl font-bold md:text-4xl">{product.name}</h1>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">{product.description}</p>
          <div className="mt-6 flex flex-wrap items-end gap-4 border-b border-border pb-6">
            <p className="text-4xl font-bold text-primary">${product.price}</p>
            <p className={`text-sm font-medium ${inStock ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {inStock ? `${product.stock} in stock` : "Out of stock"}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <CompareToggle productId={product.id} />
          </div>
          <ProductPurchaseActions productId={product.id} />
        </Card>
      </section>

      <ProductAiInsights product={product} />
      <ProductDetailsTabs productId={product.id} />

      <RecommendedProducts title="Customers also bought" productId={product.id} mode="similar" excludedIds={[product.id]} />
      <RecommendedProducts title="Similar products" productId={product.id} mode="similar-price" excludedIds={[product.id]} />
      <RecommendedProducts title="Frequently bought together" productId={product.id} mode="cart" cartProductIds={[product.id]} excludedIds={[product.id]} />
    </div>
  );
}
