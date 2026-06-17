"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import { getProductReviewSummary } from "@/lib/services/products";
import { useI18n } from "@/lib/use-i18n";
import type { Product } from "@/lib/types";
import type { ReviewSummary } from "@/lib/types/assistant";

export function ProductAiInsights({ product }: { product: Product }) {
  const { t } = useI18n();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getProductReviewSummary(product.id)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const pros = summary?.positiveThemes.length
    ? summary.positiveThemes
    : product.keyFeatures?.slice(0, 3) ?? [t("fallbackPro1"), t("fallbackPro2"), t("fallbackPro3")];

  const cons = summary?.negativeThemes.length
    ? summary.negativeThemes.map((theme) => t("someMention", { theme }))
    : [
        product.stock != null && product.stock <= 5 ? t("fallbackConStock") : t("fallbackConWarranty"),
        t("fallbackConSpecs"),
      ].filter(Boolean);

  const sentimentKey = useMemo((): "positive" | "sentimentMixed" | "neutral" | "sentimentNeedsReview" => {
    if (summary) {
      if (summary.positivePercentage >= 60) return "positive";
      if (summary.negativePercentage >= 40) return "sentimentMixed";
      return "neutral";
    }
    if ((product.rating ?? 4) >= 4) return "positive";
    if ((product.rating ?? 0) >= 3) return "sentimentMixed";
    return "sentimentNeedsReview";
  }, [summary, product.rating]);

  const sentimentTone =
    sentimentKey === "positive" ? "success" : sentimentKey === "sentimentMixed" ? "warning" : "default";

  return (
    <section className="rounded-[var(--radius-xl)] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ai">{t("aiProductInsights")}</Badge>
        <Badge tone={sentimentTone as "success" | "warning" | "default"}>
          {t("sentimentLabel", { sentiment: t(sentimentKey) })}
        </Badge>
        {summary ? (
          <Badge tone="default">
            +{summary.positivePercentage}% / −{summary.negativePercentage}%
          </Badge>
        ) : null}
      </div>
      <h2 className="section-title mt-4 text-xl font-bold">{t("whyCustomersLike", { name: product.name })}</h2>
      <p className="mt-2 text-sm text-text-muted">{t("aiInsightsDesc")}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{t("pros")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {pros.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-emerald-500">+</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">{t("considerations")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {cons.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-amber-500">−</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4 text-sm">
        <p className="font-medium">{t("aiReviewSummary")}</p>
        <p className="mt-1 text-text-muted">
          {summary?.summary ??
            t("aiSummaryFallback", {
              name: product.name,
              category: product.productType,
              brand: product.productBrand,
              rating: (product.rating ?? 0).toFixed(1),
              count: product.reviewCount ?? 0,
            })}
        </p>
      </div>
    </section>
  );
}
