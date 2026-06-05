"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Card, Skeleton } from "@/components/ui";
import { getProducts } from "@/lib/services/products";
import type { Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";

export default function RecentlyViewedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    void getProducts({ pageIndex: 1, pageSize: 100 })
      .then((r) => {
        const mapped = r.data.map(mapProductDTO);
        setProducts(mapped.filter((p) => ids.includes(p.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">Recently Viewed</h1>
      <p className="text-sm text-text-muted">Continue browsing Corner Store from where you stopped.</p>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">No recently viewed products yet.</p>
          <Link href="/products" className="mt-3 inline-flex text-sm font-semibold text-primary">
            Browse products
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
