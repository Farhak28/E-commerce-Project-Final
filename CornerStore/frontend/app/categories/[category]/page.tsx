import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductsCatalog } from "@/components/products-catalog";
import { getTypesServer } from "@/lib/services/products";
import { findTypeBySlug } from "@/lib/utils/product";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  let types: { id: number; name: string }[] = [];
  try {
    types = await getTypesServer();
  } catch {
    notFound();
  }

  const matched = findTypeBySlug(types, category);
  if (!matched) notFound();

  return (
    <div className="space-y-6">
      <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
        <h1 className="section-title text-3xl font-bold text-white">{matched.name}</h1>
        <p className="mt-2 text-sm text-white/90">Curated products from Corner Store.</p>
        <Link
          href={`/products?typeId=${matched.id}`}
          className="mt-4 inline-flex rounded-lg bg-white/20 px-3 py-2 text-sm text-white transition hover:bg-white/30"
        >
          Open full listing with filters
        </Link>
      </section>
      <ProductsCatalog initialTypeId={matched.id} />
    </div>
  );
}
