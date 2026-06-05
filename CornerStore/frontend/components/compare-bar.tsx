"use client";

import Link from "next/link";
import { useAppPreferences } from "@/components/theme-provider";
import { useCompare } from "@/lib/compare-context";
import { t } from "@/lib/i18n";

export function CompareBar() {
  const { compareIds, clearCompare } = useCompare();
  const { language, ready } = useAppPreferences();

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(var(--mobile-nav-height)+0.75rem)] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border glass-strong px-5 py-3 shadow-[var(--shadow-lg)] animate-slide-up md:bottom-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm">⚖</span>
        <span className="text-sm font-semibold" suppressHydrationWarning>
          {ready ? t("compareCount", language, { count: compareIds.length }) : `Compare (${compareIds.length}/4)`}
        </span>
      </div>
      <Link
        href={`/compare?ids=${compareIds.join(",")}`}
        className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/25 transition hover:brightness-110"
      >
        <span suppressHydrationWarning>{ready ? t("viewCompareTable", language) : "Compare now"}</span>
      </Link>
      <button type="button" className="text-xs text-text-muted hover:text-text" onClick={clearCompare}>
        {ready ? t("compareClear", language) : "Clear"}
      </button>
    </div>
  );
}
