import { ProductsCatalog } from "@/components/products-catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ typeId?: string; search?: string }>;
}) {
  const params = await searchParams;
  const typeId = params.typeId ? Number(params.typeId) : undefined;

  return (
    <ProductsCatalog
      initialTypeId={Number.isFinite(typeId) ? typeId : undefined}
      initialSearch={params.search}
    />
  );
}
