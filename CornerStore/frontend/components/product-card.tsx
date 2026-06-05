"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { Product } from "@/lib/types";
import { Button, Badge } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import { useCompare } from "@/lib/compare-context";

export function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();
  const { isSignedIn } = useAuth();
  const { language, ready } = useAppPreferences();
  const { toggleCompare, has: hasCompare } = useCompare();
  const saved = has(product.id);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addToCart(product.id, 1);
    } finally {
      setAdding(false);
    }
  };

  if (layout === "list") {
    return (
      <article className="group flex gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition hover:shadow-[var(--shadow-lg)]">
        <Link href={`/products/${product.id}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
          <ProductImage src={product.pictureUrl} alt={product.name} fill sizes="112px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{product.productType}</p>
          <Link href={`/products/${product.id}`} className="section-title line-clamp-1 text-lg font-semibold hover:text-primary">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{product.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold text-primary">${product.price}</span>
            {product.rating ? <span className="text-xs text-text-muted">{product.rating.toFixed(1)} ★</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" onClick={() => void handleAdd()} disabled={adding}>
            {ready ? t("addToCart", language) : "Add"}
          </Button>
          <Link href={`/products/${product.id}`}>
            <Button size="sm" variant="ghost">{ready ? t("view", language) : "View"}</Button>
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        <Link href={`/products/${product.id}`} className="absolute inset-0">
          <ProductImage
            src={product.pictureUrl}
            alt={product.name}
            fill
            sizes="(max-width:640px) 85vw, 320px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3">
          <Badge tone="default" className="normal-case">{product.productType}</Badge>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 transition duration-300 group-hover:translate-y-0">
          <Button size="sm" className="pointer-events-auto flex-1" onClick={() => void handleAdd()} disabled={adding}>
            + Cart
          </Button>
          {isSignedIn ? (
            <button
              type="button"
              aria-label="Wishlist"
              className={`pointer-events-auto rounded-lg px-3 py-1.5 text-sm ${saved ? "bg-red-500 text-white" : "bg-white/90 text-text"}`}
              onClick={() => void toggle(product.id)}
            >
              ♥
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Compare"
            className={`pointer-events-auto rounded-lg px-3 py-1.5 text-sm ${hasCompare(product.id) ? "bg-accent text-white" : "bg-white/90 text-text"}`}
            onClick={() => toggleCompare(product.id)}
          >
            ⚖
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-text-muted">{product.productBrand}</p>
        <Link href={`/products/${product.id}`} className="section-title mt-0.5 line-clamp-2 text-base font-semibold leading-snug hover:text-primary">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${product.price}</span>
          {product.rating ? (
            <span className="text-xs text-text-muted">{product.rating.toFixed(1)} ★ ({product.reviewCount ?? 0})</span>
          ) : null}
        </div>
        {product.stock != null && product.stock <= 10 ? (
          <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">Only {product.stock} left</p>
        ) : null}
      </div>
    </article>
  );
}
