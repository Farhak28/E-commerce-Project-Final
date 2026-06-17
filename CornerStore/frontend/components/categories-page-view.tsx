"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/use-i18n";
import { toTypeSlug } from "@/lib/utils/product";

const categoryImages = [
  "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop",
];

export function CategoriesPageView({ types }: { types: { id: number; name: string }[] }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="animate-float sheen-hover glass rounded-3xl p-6 md:p-8">
        <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
          {t("categoriesTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>
          {t("categoriesBrowseDesc")}
        </p>
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
                <Image
                  src={img}
                  alt={type.name}
                  fill
                  sizes="600px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h2 className="section-title text-xl font-semibold">{type.name}</h2>
                <p className="mt-1 text-sm text-primary" suppressHydrationWarning>
                  {t("openCollectionArrow")}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
