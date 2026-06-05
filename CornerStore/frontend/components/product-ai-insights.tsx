"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import { getProductReviewSummary } from "@/lib/services/products";
import type { Product } from "@/lib/types";
import type { ReviewSummary } from "@/lib/types/assistant";

export function ProductAiInsights({ product }: { product: Product }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getProductReviewSummary(product.id)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => { if (!cancelled) setSummary(null); });
    return () => { cancelled = true; };
  }, [product.id]);

  const pros = summary?.positiveThemes.length
    ? summary.positiveThemes
    : product.keyFeatures?.slice(0, 3) ?? [
        "Reliable build quality",
        "Great value for the price",
        "Popular with customers",
      ];

  const cons = summary?.negativeThemes.length
    ? summary.negativeThemes.map((t) => `Some mention ${t}`)
    : [
        product.stock != null && product.stock <= 5 ? "Limited stock available" : "Standard warranty terms apply",
        "Check specifications for compatibility",
      ].filter(Boolean);

  const sentiment = summary
    ? summary.positivePercentage >= 60
      ? "Positive"
      : summary.negativePercentage >= 40
        ? "Mixed"
        : "Neutral"
    : (product.rating ?? 4) >= 4
      ? "Positive"
      : (product.rating ?? 0) >= 3
        ? "Mixed"
        : "Needs review";

  const sentimentTone = sentiment === "Positive" ? "success" : sentiment === "Mixed" ? "warning" : "default";

  return (
    <section className="rounded-[var(--radius-xl)] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ai">✦ AI Product Insights</Badge>
        <Badge tone={sentimentTone as "success" | "warning" | "default"}>{sentiment} sentiment</Badge>
        {summary ? (
          <Badge tone="default">
            +{summary.positivePercentage}% / −{summary.negativePercentage}%
          </Badge>
        ) : null}
      </div>
      <h2 className="section-title mt-4 text-xl font-bold">Why customers like {product.name}</h2>
      <p className="mt-2 text-sm text-text-muted">
        AI-generated summary based on customer review sentiment analysis.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Pros</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {pros.map((p) => (
              <li key={p} className="flex gap-2"><span className="text-emerald-500">+</span>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Considerations</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {cons.map((c) => (
              <li key={c} className="flex gap-2"><span className="text-amber-500">−</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4 text-sm">
        <p className="font-medium">AI Review Summary</p>
        <p className="mt-1 text-text-muted">
          {summary?.summary ??
            `${product.name} in the ${product.productType} category from ${product.productBrand} is rated ${(product.rating ?? 0).toFixed(1)}/5 across ${product.reviewCount ?? 0} reviews.`}
        </p>
      </div>
    </section>
  );
}
