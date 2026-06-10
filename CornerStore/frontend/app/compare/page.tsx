"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Skeleton } from "@/components/ui";
import { BrandOfficialLink } from "@/components/brand-official-link";
import { ProductComparisonTable } from "@/components/product-comparison-table";
import { getProducts } from "@/lib/services/products";
import type { Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { useCompare } from "@/lib/compare-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";

function CompareContent() {
  const searchParams = useSearchParams();
  const { compareIds, toggleCompare } = useCompare();
  const { language, ready } = useAppPreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const idsFromQuery = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return compareIds;
    return raw
      .split(",")
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n));
  }, [searchParams, compareIds]);

  useEffect(() => {
    if (idsFromQuery.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void getProducts({ pageIndex: 1, pageSize: 50 })
      .then((result) => {
        const mapped = result.data.map(mapProductDTO);
        setProducts(mapped.filter((p) => idsFromQuery.includes(p.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [idsFromQuery]);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
        {ready ? t("compareTitle", language) : "Compare products"}
      </h1>
      <p className="text-sm text-text-muted" suppressHydrationWarning>
        {ready ? t("compareSubtitle", language) : "Side-by-side view for products you added to compare."}
      </p>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted" suppressHydrationWarning>
            {ready ? t("compareEmpty", language) : "No products selected."}
          </p>
          <Link href="/products" className="mt-3 inline-flex text-sm font-semibold text-primary">
            <span suppressHydrationWarning>{ready ? t("browseProducts", language) : "Browse products"}</span>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {products.length >= 2 ? <ProductComparisonTable products={products} /> : null}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id}>
                <div className="relative h-40 overflow-hidden rounded-xl">
                  <Image src={product.pictureUrl} alt={product.name} fill sizes="400px" className="object-cover" />
                </div>
                <h2 className="section-title mt-3 text-lg font-semibold">{product.name}</h2>
                <p className="text-sm text-text-muted">{product.productBrand} · {product.productType}</p>
                <p className="mt-2 font-bold text-primary">${product.price}</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/products/${product.id}`} className="text-sm font-semibold text-primary">
                    <span suppressHydrationWarning>{ready ? t("viewDetails", language) : "View details"}</span>
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-text-muted underline"
                    onClick={() => toggleCompare(product.id)}
                  >
                    <span suppressHydrationWarning>{ready ? t("remove", language) : "Remove"}</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="section-title text-lg font-semibold" suppressHydrationWarning>
              {ready ? "Official brand pages" : "Official brand pages"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Learn more from each manufacturer&apos;s website.
            </p>
            <ul className="mt-4 space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-text-muted">{product.productBrand}</p>
                  </div>
                  <BrandOfficialLink
                    brandName={product.productBrand}
                    officialUrl={product.brandOfficialUrl}
                    variant="card"
                  />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">…</p>}>
      <CompareContent />
    </Suspense>
  );
}
