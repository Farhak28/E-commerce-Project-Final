"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAppPreferences } from "@/components/theme-provider";
import { getProducts } from "@/lib/services/products";
import type { Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { t } from "@/lib/i18n";

export default function WishlistPage() {
  const { ids, remove, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { language } = useAppPreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    void getProducts({ pageIndex: 1, pageSize: 100 })
      .then((r) => {
        const mapped = r.data.map(mapProductDTO);
        setProducts(mapped.filter((p) => ids.includes(p.id)));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [ids]);

  return (
    <div className="space-y-6">
      <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
        <h1 className="section-title text-3xl font-bold text-white">{t("wishlist", language)}</h1>
        <p className="mt-1 text-sm text-white/90">Saved products at Corner Store with quick move-to-cart actions.</p>
      </section>

      {isLoading || loadingProducts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted">No items in your wishlist yet.</p>
              <Link href="/products" className="mt-3 inline-flex text-sm font-semibold text-primary">
                Browse products
              </Link>
            </Card>
          ) : null}
          {products.map((product) => (
            <Card key={product.id}>
              <div className="relative h-44 overflow-hidden rounded-xl">
                <Image src={product.pictureUrl} alt={product.name} fill sizes="400px" className="object-cover" />
              </div>
              <p className="mt-3 text-xs text-text-muted">{product.productType}</p>
              <h2 className="section-title text-lg font-semibold">{product.name}</h2>
              <p className="mt-1 text-sm text-text-muted">{product.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => void addToCart(product.id, 1)}>
                  {t("addToCart", language)}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void remove(product.id)}>
                  {t("remove", language)}
                </Button>
                <Link
                  href={`/products/${product.id}`}
                  className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-surface-2"
                >
                  {t("view", language)}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
