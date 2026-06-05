"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { useWishlist } from "@/lib/wishlist-context";
import { mapProductDTO } from "@/lib/utils/product";
import type { VisualProductMatch } from "@/lib/types/visual-search";
import type { ProductDTO } from "@/lib/types";

function tierLabel(tier: VisualProductMatch["matchTier"]) {
  if (tier === "exact") return "Exact match";
  if (tier === "similar") return "Similar";
  return "Alternative";
}

function tierTone(tier: VisualProductMatch["matchTier"]) {
  if (tier === "exact") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (tier === "similar") return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400";
  return "bg-surface-2 text-text-muted";
}

function VisualMatchCard({ match }: { match: VisualProductMatch }) {
  const product = mapProductDTO(match.product as ProductDTO);
  const { addToCart } = useCart();
  const { toggle, has } = useWishlist();
  const { toggleCompare, has: inCompare } = useCompare();
  const { isSignedIn } = useAuth();
  const [adding, setAdding] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Link href={`/products/${product.id}`} className="flex gap-3 p-3 transition hover:bg-surface-2">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <ProductImage src={product.pictureUrl} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tierTone(match.matchTier)}`}>
              {match.matchPercentage}% · {tierLabel(match.matchTier)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 font-semibold">{product.name}</p>
          <p className="text-xs text-text-muted">
            ${product.price}
            {product.rating ? ` · ★ ${product.rating.toFixed(1)}` : ""}
          </p>
        </div>
      </Link>
      <div className="grid grid-cols-4 border-t border-border text-[10px] font-semibold">
        <Link href={`/products/${product.id}`} className="py-2 text-center text-primary hover:bg-primary/5">
          View
        </Link>
        <button
          type="button"
          className="border-l border-border py-2 text-primary hover:bg-primary/5"
          disabled={adding}
          onClick={() => {
            setAdding(true);
            void addToCart(product.id, 1).finally(() => setAdding(false));
          }}
        >
          {adding ? "…" : "Cart"}
        </button>
        <button
          type="button"
          className="border-l border-border py-2 text-primary hover:bg-primary/5 disabled:opacity-50"
          disabled={!isSignedIn}
          onClick={() => void toggle(product.id)}
        >
          {has(product.id) ? "♥ Saved" : "Wishlist"}
        </button>
        <button
          type="button"
          className={`border-l border-border py-2 ${inCompare(product.id) ? "text-accent" : "text-primary hover:bg-primary/5"}`}
          onClick={() => toggleCompare(product.id)}
        >
          {inCompare(product.id) ? "✓ Compare" : "Compare"}
        </button>
      </div>
    </div>
  );
}

export function VisualSearchResultCards({
  exactMatches,
  similarProducts,
  alternatives,
}: {
  exactMatches: VisualProductMatch[];
  similarProducts: VisualProductMatch[];
  alternatives: VisualProductMatch[];
}) {
  const all = [...exactMatches, ...similarProducts, ...alternatives];
  if (!all.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {all.map((match) => (
        <VisualMatchCard key={`${match.product.id}-${match.matchTier}`} match={match} />
      ))}
    </div>
  );
}

export function VisualSearchImagePreview({ src, onClear }: { src: string; onClear?: () => void }) {
  return (
    <div className="relative mt-2 inline-block">
      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Uploaded product" className="h-full w-full object-cover" />
      </div>
      {onClear ? (
        <button
          type="button"
          className="absolute -right-1 -top-1 rounded-full bg-surface px-1.5 text-xs shadow border border-border"
          onClick={onClear}
          aria-label="Remove image"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
