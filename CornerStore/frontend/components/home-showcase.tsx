"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { RecommendedProducts } from "@/components/recommended-products";
import { AiShowcaseStrip } from "@/components/ai-showcase-badges";
import { Button, Skeleton } from "@/components/ui";
import { useAssistant } from "@/lib/assistant-context";
import { getProducts, getTypes } from "@/lib/services/products";
import { getTrendingProducts } from "@/lib/services/recommendations";
import type { Product, TypeDTO } from "@/lib/types";
import { mapProductDTO, toTypeSlug } from "@/lib/utils/product";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";

const AI_PROMPTS = [
  "Recommend a phone under 15000 EGP",
  "Best laptop for students",
  "Compare gaming headphones",
  "Track my order",
];

const TESTIMONIALS = [
  { name: "Sarah M.", text: "The AI assistant helped me find the perfect gift in seconds. Feels like a premium store.", rating: 5 },
  { name: "Omar K.", text: "Checkout was smooth and product recommendations were spot on.", rating: 5 },
  { name: "Lina H.", text: "Love the dark mode and how natural the shopping chat feels.", rating: 4 },
];

export function HomeShowcase() {
  const { toggle: openAssistant } = useAssistant();
  const [products, setProducts] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [types, setTypes] = useState<TypeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getProducts({ pageIndex: 1, pageSize: 8 }),
      getTrendingProducts(8),
      getTypes(),
    ])
      .then(([catalog, trend, typeList]) => {
        if (cancelled) return;
        setProducts(catalog.data.map(mapProductDTO));
        setTrending(trend.map(mapProductDTO));
        setTypes(typeList);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-16">
        <Skeleton className="h-[420px] w-full rounded-[var(--radius-xl)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hero = products[0] ?? trending[0];
  const recentIds = getRecentlyViewedIds();

  return (
    <div className="space-y-[var(--space-section)]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-lg)]">
        <div className="absolute inset-0 bg-[var(--hero-gradient)] opacity-95" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
          <div className="flex flex-col justify-center text-white">
            <p className="text-label text-white/70">AI-powered shopping</p>
            <h1 className="text-display-xl mt-3 text-white">
              Find the perfect product with AI
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/85">
              Discover, compare, and buy with intelligent recommendations, natural-language search, and a shopping assistant that knows your store inside out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openAssistant} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-lg transition hover:scale-[1.02]">
                ✦ Ask AI Assistant
              </button>
              <Link href="/products">
                <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Browse catalog
                </Button>
              </Link>
            </div>
          </div>
          {hero ? (
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <ProductImage src={hero.pictureUrl} alt={hero.name} fill sizes="500px" className="object-cover" priority />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <p className="text-sm text-white/80">Featured</p>
                <p className="font-bold text-white">{hero.name}</p>
                <p className="text-lg font-bold text-white">${hero.price}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <AiShowcaseStrip />

      {/* Categories */}
      {types.length > 0 ? (
        <section className="animate-rise">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted">Browse</p>
              <h2 className="text-display-lg section-title">Featured categories</h2>
            </div>
            <Link href="/categories" className="text-sm font-semibold text-primary">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {types.slice(0, 8).map((type) => (
              <Link
                key={type.id}
                href={`/categories/${toTypeSlug(type.name)}`}
                className="group card-premium sheen-hover flex items-center gap-4 p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl transition group-hover:scale-110">▦</span>
                <div>
                  <p className="font-semibold">{type.name}</p>
                  <p className="text-xs text-text-muted group-hover:text-primary">Shop now →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trending carousel-style grid */}
      {trending.length > 0 ? (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted">Popular now</p>
              <h2 className="text-display-lg section-title">Trending products</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-primary">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {trending.map((product) => (
              <div key={product.id} className="w-[min(280px,85vw)] shrink-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <RecommendedProducts title="Recommended for you" mode="personalized" excludedIds={products.map((p) => p.id)} />

      {/* Best sellers */}
      {products.length > 0 ? (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted">Top picks</p>
              <h2 className="text-display-lg section-title">Best sellers</h2>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {recentIds.length > 0 ? (
        <RecommendedProducts title="Continue exploring" mode="recent" recentProductIds={recentIds} />
      ) : null}

      {/* AI section */}
      <section className="rounded-[var(--radius-xl)] border border-primary/20 bg-gradient-to-br from-primary/5 to-cyan-500/5 p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-label text-primary">AI Shopping Assistant</p>
          <h2 className="text-display-lg section-title mt-2">Shop smarter with natural language</h2>
          <p className="mt-3 text-sm text-text-muted">
            Search products, compare options, get personalized picks, and track orders — all in one conversation.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {AI_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={openAssistant}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition hover:border-primary/40 hover:bg-primary/5"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button onClick={openAssistant}>Start chatting →</Button>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="mb-6 text-center">
          <p className="text-label text-text-muted">Testimonials</p>
          <h2 className="text-display-lg section-title">Loved by shoppers</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card-premium p-6">
              <p className="text-amber-500">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</p>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
