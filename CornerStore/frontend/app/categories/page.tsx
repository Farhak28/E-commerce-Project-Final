import Image from "next/image";
import Link from "next/link";
import { getTypesServer } from "@/lib/services/products";
import { toTypeSlug } from "@/lib/utils/product";

const categoryImages = [
  "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523475496153-3d6cc6c22a18?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512508561942-18fbe1d1cf0c?auto=format&fit=crop&w=1200&q=80",
];

export default async function CategoriesPage() {
  let types: { id: number; name: string }[] = [];
  try {
    types = await getTypesServer();
  } catch {
    types = [];
  }

  return (
    <div className="space-y-6">
      <section className="animate-float sheen-hover glass rounded-3xl p-6 md:p-8">
        <h1 className="section-title text-3xl font-bold">Categories</h1>
        <p className="mt-2 text-sm text-text-muted">Browse Corner Store collections by product type.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type, index) => {
          const img = `${categoryImages[index % categoryImages.length]}&sig=${index + 1}`;
          return (
            <Link
              key={type.id}
              href={`/categories/${toTypeSlug(type.name)}`}
              className="animate-rise sheen-hover group overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow)]"
            >
              <div className="relative h-44">
                <Image src={img} alt={type.name} fill sizes="600px" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-5">
                <h2 className="section-title mt-1 text-xl font-semibold">{type.name}</h2>
                <p className="mt-2 text-sm text-text-muted">Open collection</p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
