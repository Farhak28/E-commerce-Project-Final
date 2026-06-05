"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import { getBrands, getProducts, getTypes } from "@/lib/services/products";
import type { BrandDTO, Product, TypeDTO } from "@/lib/types";
import { ProductSortingOptions } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";

type SortBy = "popular" | "price-low" | "price-high" | "name";

const sortMap: Record<SortBy, ProductSortingOptions | undefined> = {
  popular: undefined,
  "price-low": ProductSortingOptions.PriceAsc,
  "price-high": ProductSortingOptions.PriceDesc,
  name: ProductSortingOptions.NameAsc,
};

type ViewMode = "grid" | "list";

export function ProductsCatalog({
  initialTypeId,
  initialSearch,
}: {
  initialTypeId?: number;
  initialSearch?: string;
}) {
  const { language, ready } = useAppPreferences();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [selectedTypeId, setSelectedTypeId] = useState<number | "all">(initialTypeId ?? "all");
  const [selectedBrandId, setSelectedBrandId] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageIndex, setPageIndex] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [types, setTypes] = useState<TypeDTO[]>([]);
  const [brands, setBrands] = useState<BrandDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 9;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getTypes(), getBrands()])
      .then(([typesData, brandsData]) => {
        if (!cancelled) {
          setTypes(typesData);
          setBrands(brandsData);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await getProducts({
          search: search.trim() || undefined,
          typeId: selectedTypeId === "all" ? undefined : selectedTypeId,
          brandId: selectedBrandId === "all" ? undefined : selectedBrandId,
          sort: sortMap[sortBy],
          pageIndex,
          pageSize,
        });
        if (cancelled) return;
        setProducts(result.data.map(mapProductDTO));
        setTotalCount(result.count);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load products");
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, selectedTypeId, selectedBrandId, sortBy, pageIndex]);

  useEffect(() => {
    setPageIndex(1);
  }, [search, selectedTypeId, selectedBrandId, sortBy]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
        <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
          {ready ? t("productListing", language) : "Product Listing"}
        </h1>
        <div className="w-full md:w-80">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ready ? t("searchProductsPlaceholder", language) : "Search products, brands, types…"}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <h2 className="section-title text-lg font-semibold" suppressHydrationWarning>
            {ready ? t("filters", language) : "Filters"}
          </h2>
          <div className="mt-3 space-y-4 text-sm text-text-muted">
            <div>
              <p className="mb-2 font-medium text-text" suppressHydrationWarning>
                {ready ? t("type", language) : "Type"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTypeId("all")}
                  className={`rounded-full px-3 py-1 text-xs transition ${selectedTypeId === "all" ? "bg-primary text-white" : "bg-surface-2 hover:bg-primary/10"}`}
                >
                  {ready ? t("all", language) : "All"}
                </button>
                {types.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedTypeId(item.id)}
                    className={`rounded-full px-3 py-1 text-xs transition ${selectedTypeId === item.id ? "bg-primary text-white" : "bg-surface-2 hover:bg-primary/10"}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium text-text" suppressHydrationWarning>
                {ready ? t("brand", language) : "Brand"}
              </p>
              <select
                value={selectedBrandId === "all" ? "" : selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : "all")}
                className="w-full rounded-lg border border-border bg-surface-2 px-2 py-2 text-sm"
              >
                <option value="">{ready ? t("allBrands", language) : "All brands"}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-sm">
            <p suppressHydrationWarning>
              {loading
                ? ready
                  ? t("loading", language)
                  : "Loading…"
                : ready
                  ? t("results", language, { count: totalCount })
                  : `${totalCount} results`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md px-2 py-1 text-xs ${viewMode === "grid" ? "bg-primary text-white" : "bg-surface-2"}`}
              >
                <span suppressHydrationWarning>{ready ? t("grid", language) : "Grid"}</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md px-2 py-1 text-xs ${viewMode === "list" ? "bg-primary text-white" : "bg-surface-2"}`}
              >
                <span suppressHydrationWarning>{ready ? t("list", language) : "List"}</span>
              </button>
              <label className="flex items-center gap-2">
                <span suppressHydrationWarning>{ready ? t("sortBy", language) : "Sort by"}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1"
                >
                  <option value="popular">{ready ? t("sortDefault", language) : "Default"}</option>
                  <option value="price-low">{ready ? t("sortPriceLow", language) : "Price: low to high"}</option>
                  <option value="price-high">{ready ? t("sortPriceHigh", language) : "Price: high to low"}</option>
                  <option value="name">{ready ? t("sortName", language) : "Name"}</option>
                </select>
              </label>
            </div>
          </div>

          {error ? <p className="text-sm text-accent">{error}</p> : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted" suppressHydrationWarning>
                {ready ? t("noProductsMatch", language) : "No products match your filters."}
              </p>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} layout="list" />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="ghost" disabled={pageIndex <= 1} onClick={() => setPageIndex((p) => p - 1)}>
                <span suppressHydrationWarning>{ready ? t("previous", language) : "Previous"}</span>
              </Button>
              <span className="text-sm text-text-muted" suppressHydrationWarning>
                {ready ? t("pageOf", language, { page: pageIndex, total: totalPages }) : `Page ${pageIndex} of ${totalPages}`}
              </span>
              <Button type="button" variant="ghost" disabled={pageIndex >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>
                <span suppressHydrationWarning>{ready ? t("next", language) : "Next"}</span>
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
