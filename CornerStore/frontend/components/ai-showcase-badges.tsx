"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { useI18n } from "@/lib/use-i18n";

const FEATURE_KEYS = [
  { key: "aiFeatureAssistant" as const, icon: "✦" },
  { key: "aiFeatureRecommendations" as const, icon: "↗" },
  { key: "aiFeatureCompare" as const, icon: "⚖" },
  { key: "aiFeatureReviews" as const, icon: "★" },
  { key: "aiFeatureRag" as const, icon: "▤" },
  { key: "aiFeaturePicks" as const, icon: "◎" },
];

export function AiShowcaseBadges({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
      {FEATURE_KEYS.map((f) => (
        <Badge key={f.key} tone="ai" className="normal-case tracking-normal">
          <span aria-hidden>{f.icon}</span>
          <span suppressHydrationWarning>{t(f.key)}</span>
        </Badge>
      ))}
    </div>
  );
}

export function AiShowcaseStrip() {
  const { t } = useI18n();

  return (
    <section className="rounded-[var(--radius-xl)] border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-transparent to-cyan-500/5 p-6 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-label text-primary" suppressHydrationWarning>
            {t("graduationShowcase")}
          </p>
          <h2 className="section-title mt-1 text-xl font-bold md:text-2xl" suppressHydrationWarning>
            {t("poweredByAiTitle")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-text-muted" suppressHydrationWarning>
            {t("poweredByAiDesc")}
          </p>
        </div>
        <Link
          href="/help"
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110"
        >
          <span suppressHydrationWarning>{t("tryAssistant")}</span>
        </Link>
      </div>
      <div className="mt-5">
        <AiShowcaseBadges />
      </div>
    </section>
  );
}
