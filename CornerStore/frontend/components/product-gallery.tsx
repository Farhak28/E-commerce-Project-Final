"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const [fullscreen, setFullscreen] = useState(false);
  const images = [product.pictureUrl];

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-2 transition hover:shadow-[var(--shadow-lg)]"
          onClick={() => setFullscreen(true)}
          aria-label="Open fullscreen preview"
        >
          <ProductImage src={product.pictureUrl} alt={product.name} fill sizes="700px" className="object-cover transition hover:scale-105 duration-500" priority />
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            Click to zoom
          </span>
        </button>
        <div className="flex gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-primary ring-2 ring-primary/20">
              <ProductImage src={src} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      {fullscreen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fade"
          role="dialog"
          aria-modal
          onClick={() => setFullscreen(false)}
        >
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-white" onClick={() => setFullscreen(false)}>
            Close ×
          </button>
          <div className="relative h-[min(80vh,700px)] w-full max-w-3xl">
            <ProductImage src={product.pictureUrl} alt={product.name} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
