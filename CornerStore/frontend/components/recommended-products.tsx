"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui";
import { getProducts } from "@/lib/services/products";
import {
  getBoughtTogetherProducts,
  getPersonalizedProducts,
  getPersonalizedProductsGuest,
  getProductsByBudget,
  getProductsByCategory,
  getRecommendationsForProducts,
  getSimilarPriceProducts,
  getSimilarProducts,
  getTrendingProducts,
} from "@/lib/services/recommendations";
import { useAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";

type Mode =
  | "similar"
  | "similar-price"
  | "bought-together"
  | "trending"
  | "personalized"
  | "search"
  | "cart"
  | "recent"
  | "budget"
  | "category";

const EMPTY_EXCLUDED: number[] = [];

export function RecommendedProducts({
  title,
  productId,
  query,
  mode = productId ? "similar" : query ? "search" : "trending",
  excludedIds,
  cartProductIds,
  recentProductIds,
  maxPrice,
  category,
}: {
  title: string;
  productId?: number;
  query?: string;
  mode?: Mode;
  excludedIds?: number[];
  cartProductIds?: number[];
  recentProductIds?: number[];
  maxPrice?: number;
  category?: string;
}) {
  const { isSignedIn } = useAuth();
  const { language, ready } = useAppPreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const trackingSource =
    mode === "similar"
      ? "similar"
      : mode === "similar-price"
        ? "similar-price"
        : mode === "bought-together"
          ? "bought-together"
          : mode === "personalized"
            ? "personalized"
            : mode === "cart" || mode === "recent"
              ? "for-products"
              : mode === "budget"
                ? "by-budget"
                : mode === "category"
                  ? "by-category"
                  : "trending";

  const excluded = excludedIds ?? EMPTY_EXCLUDED;
  const excludedKey = useMemo(() => excluded.join(","), [excluded]);
  const cartKey = useMemo(() => (cartProductIds ?? []).join(","), [cartProductIds]);
  const recentKey = useMemo(
    () => (recentProductIds ?? []).join(","),
    [recentProductIds],
  );

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        let dtos;
        const recent = recentProductIds?.length
          ? recentProductIds
          : getRecentlyViewedIds();
        const cart = cartProductIds ?? [];
        const recoCtx = { cartIds: cart, recentIds: recent };

        if (mode === "similar" && productId != null) {
          dtos = await getSimilarProducts(productId, 6);
        } else if (mode === "bought-together" && productId != null) {
          dtos = await getBoughtTogetherProducts(productId, 6);
        } else if (mode === "similar-price" && productId != null) {
          dtos = await getSimilarPriceProducts(productId, 6);
        } else if (mode === "trending") {
          dtos = await getTrendingProducts(8);
        } else if (mode === "personalized") {
          dtos = isSignedIn
            ? await getPersonalizedProducts(8, recoCtx)
            : await getPersonalizedProductsGuest(8, recoCtx);
        } else if (mode === "cart" && cart.length > 0) {
          dtos = await getRecommendationsForProducts(cart, 8);
        } else if (mode === "recent" && recent.length > 0) {
          dtos = await getRecommendationsForProducts(recent.slice(0, 6), 8);
        } else if (mode === "budget" && maxPrice != null) {
          dtos = await getProductsByBudget(maxPrice, 8);
        } else if (mode === "category" && category) {
          dtos = await getProductsByCategory(category, 8);
        } else if (mode === "search") {
          const result = await getProducts({ search: query ?? "", pageIndex: 1, pageSize: 8 });
          dtos = result.data;
        } else {
          dtos = await getTrendingProducts(8);
        }
        if (cancelled) return;
        const excludedSet = new Set(excluded);
        setProducts(
          dtos.map(mapProductDTO).filter((p) => !excludedSet.has(p.id)).slice(0, 4),
        );
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    productId,
    query,
    mode,
    excludedKey,
    cartKey,
    recentKey,
    isSignedIn,
    ready,
    maxPrice,
    category,
    cartProductIds,
    recentProductIds,
  ]);

  if (!ready) {
    return (
      <section className="space-y-4 rounded-3xl border border-border bg-surface p-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-xl font-semibold">{title}</h2>
        <Link href="/products" className="text-sm font-semibold text-primary">
          {t("viewAll", language)}
        </Link>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-text-muted">
          {language === "ar" ? "لا توجد توصيات متاحة حالياً." : "No recommendations available right now."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              recommendationSource={trackingSource}
            />
          ))}
        </div>
      )}
    </section>
  );
}
