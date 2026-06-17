"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { RecommendedProducts } from "@/components/recommended-products";
import { AiShowcaseStrip } from "@/components/ai-showcase-badges";
import { Button, Skeleton } from "@/components/ui";
import { useAssistant } from "@/lib/assistant-context";
import { getProducts, getTypes } from "@/lib/services/products";
import { getTrendingProducts } from "@/lib/services/recommendations";
import type { Product, TypeDTO } from "@/lib/types";
import { useI18n } from "@/lib/use-i18n";
import { mapProductDTO, toTypeSlug } from "@/lib/utils/product";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";

export function HomeShowcase() {
  const { toggle: openAssistant } = useAssistant();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [types, setTypes] = useState<TypeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const aiPrompts = useMemo(
    () => [
      t("aiPromptPhone"),
      t("aiPromptLaptop"),
      t("aiPromptHeadphones"),
      t("aiPromptTrack"),
    ],
    [t],
  );

  const testimonials = useMemo(
    () => [
      { name: "Sarah M.", text: t("testimonial1"), rating: 5 },
      { name: "Omar K.", text: t("testimonial2"), rating: 5 },
      { name: "Lina H.", text: t("testimonial3"), rating: 4 },
    ],
    [t],
  );

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
    return () => {
      cancelled = true;
    };
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
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border shadow-[var(--shadow-lg)]">
        <div className="absolute inset-0 bg-[var(--hero-gradient)] opacity-95" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-16">
          <div className="flex flex-col justify-center text-white">
            <p className="text-label text-white/70" suppressHydrationWarning>
              {t("heroLabel")}
            </p>
            <h1 className="text-display-xl mt-3 text-white" suppressHydrationWarning>
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/85" suppressHydrationWarning>
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openAssistant}
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-lg transition hover:scale-[1.02]"
                suppressHydrationWarning
              >
                ✦ {t("askAiAssistant")}
              </button>
              <Link href="/products">
                <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <span suppressHydrationWarning>{t("browseCatalog")}</span>
                </Button>
              </Link>
            </div>
          </div>
          {hero ? (
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <ProductImage src={hero.pictureUrl} alt={hero.name} fill sizes="500px" className="object-cover" priority />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <p className="text-sm text-white/80" suppressHydrationWarning>
                  {t("featured")}
                </p>
                <p className="font-bold text-white">{hero.name}</p>
                <p className="text-lg font-bold text-white">${hero.price}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <AiShowcaseStrip />

      {types.length > 0 ? (
        <section className="animate-rise">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted" suppressHydrationWarning>
                {t("browse")}
              </p>
              <h2 className="text-display-lg section-title" suppressHydrationWarning>
                {t("featuredCategories")}
              </h2>
            </div>
            <Link href="/categories" className="text-sm font-semibold text-primary" suppressHydrationWarning>
              {t("viewAll")} →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {types.slice(0, 8).map((type) => (
              <Link
                key={type.id}
                href={`/categories/${toTypeSlug(type.name)}`}
                className="group card-premium sheen-hover flex items-center gap-4 p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl transition group-hover:scale-110">
                  ▦
                </span>
                <div>
                  <p className="font-semibold">{type.name}</p>
                  <p className="text-xs text-text-muted group-hover:text-primary" suppressHydrationWarning>
                    {t("shopNow")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {trending.length > 0 ? (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted" suppressHydrationWarning>
                {t("popularNow")}
              </p>
              <h2 className="text-display-lg section-title" suppressHydrationWarning>
                {t("trendingProducts")}
              </h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-primary" suppressHydrationWarning>
              {t("viewAll")} →
            </Link>
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

      <RecommendedProducts
        title={t("recommendedForYou")}
        mode="personalized"
        excludedIds={products.map((p) => p.id)}
      />

      {products.length > 0 ? (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-label text-text-muted" suppressHydrationWarning>
                {t("topPicks")}
              </p>
              <h2 className="text-display-lg section-title" suppressHydrationWarning>
                {t("bestSellers")}
              </h2>
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
        <RecommendedProducts title={t("continueExploring")} mode="recent" recentProductIds={recentIds} />
      ) : null}

      <section className="rounded-[var(--radius-xl)] border border-primary/20 bg-gradient-to-br from-primary/5 to-cyan-500/5 p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-label text-primary" suppressHydrationWarning>
            {t("aiAssistant")}
          </p>
          <h2 className="text-display-lg section-title mt-2" suppressHydrationWarning>
            {t("shopSmarterTitle")}
          </h2>
          <p className="mt-3 text-sm text-text-muted" suppressHydrationWarning>
            {t("shopSmarterDesc")}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {aiPrompts.map((prompt) => (
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
          <Button onClick={openAssistant}>
            <span suppressHydrationWarning>{t("startChatting")}</span>
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-6 text-center">
          <p className="text-label text-text-muted" suppressHydrationWarning>
            {t("testimonials")}
          </p>
          <h2 className="text-display-lg section-title" suppressHydrationWarning>
            {t("lovedByShoppers")}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="card-premium p-6">
              <p className="text-amber-500">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</p>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">&ldquo;{item.text}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold">{item.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
