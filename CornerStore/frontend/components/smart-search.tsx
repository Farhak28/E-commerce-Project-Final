"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/product-image";
import { Skeleton } from "@/components/ui";
import { getProducts } from "@/lib/services/products";
import type { Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";

const RECENT_KEY = "corner_store_recent_searches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const list = [q, ...loadRecent().filter((x) => x !== q)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function SmartSearch({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void getProducts({ search: q.trim(), pageIndex: 1, pageSize: 6 })
        .then((r) => setResults(r.data.map(mapProductDTO)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
  }, []);

  const go = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setRecent(loadRecent());
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/80 px-4 py-2 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
        <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            search(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go(query);
          }}
          placeholder="Search products, brands, categories…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
          aria-label="Search products"
          aria-expanded={open}
          aria-controls="search-suggestions"
        />
        {query ? (
          <button type="button" className="text-xs text-text-muted hover:text-text" onClick={() => { setQuery(""); setResults([]); }}>
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id="search-suggestions"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-lg)] animate-rise"
        >
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : query.trim() && results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-surface-2"
                    onClick={() => {
                      saveRecent(query);
                      setOpen(false);
                    }}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage src={p.pictureUrl} alt="" fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-text-muted">${p.price} · {p.productType}</p>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border p-2">
                <button type="button" className="w-full rounded-lg py-2 text-sm font-semibold text-primary hover:bg-primary/5" onClick={() => go(query)}>
                  View all results for &ldquo;{query}&rdquo;
                </button>
              </li>
            </ul>
          ) : query.trim() ? (
            <p className="p-4 text-sm text-text-muted">No products found. Try different keywords.</p>
          ) : recent.length > 0 ? (
            <div className="p-3">
              <p className="text-label mb-2 text-text-muted">Recent searches</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} type="button" className="rounded-full bg-surface-2 px-3 py-1 text-xs hover:bg-primary/10" onClick={() => go(r)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="p-4 text-sm text-text-muted">Start typing to search the catalog instantly.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
