import { ProductDetailsTabs } from "@/components/product-details-tabs";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { ProductGallery } from "@/components/product-gallery";
import { ProductAiInsights } from "@/components/product-ai-insights";
import { ProductDetailSidebar } from "@/components/product-detail-sidebar";
import { ProductDetailRecommendations } from "@/components/product-detail-recommendations";
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

  return (
    <div className="space-y-10">
      <ProductViewTracker productId={product.id} />

      <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery product={product} />
        <ProductDetailSidebar product={product} />
      </section>

      <ProductAiInsights product={product} />
      <ProductDetailsTabs productId={product.id} />

      <ProductDetailRecommendations productId={product.id} />
    </div>
  );
}
