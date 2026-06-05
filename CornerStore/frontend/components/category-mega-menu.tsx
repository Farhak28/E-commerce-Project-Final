"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getTypes } from "@/lib/services/products";
import type { TypeDTO } from "@/lib/types";
import { toTypeSlug } from "@/lib/utils/product";

export function CategoryMegaMenu() {
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<TypeDTO[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getTypes().then(setTypes).catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`flex items-center gap-1 text-sm font-medium transition ${open ? "text-primary" : "text-text-muted hover:text-text"}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Categories
        <svg className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(420px,90vw)] animate-rise rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-lg)]">
          <p className="text-label mb-3 text-text-muted">Shop by category</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {types.map((type) => (
              <Link
                key={type.id}
                href={`/categories/${toTypeSlug(type.name)}`}
                className="rounded-xl border border-border bg-surface-2/50 px-3 py-3 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5"
                onClick={() => setOpen(false)}
              >
                {type.name}
              </Link>
            ))}
          </div>
          <Link href="/categories" className="mt-3 block text-center text-sm font-semibold text-primary" onClick={() => setOpen(false)}>
            View all categories →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
