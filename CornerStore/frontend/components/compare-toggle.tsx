"use client";

import { useCompare } from "@/lib/compare-context";
import { Button } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";

export function CompareToggle({ productId }: { productId: number }) {
  const { toggleCompare, has } = useCompare();
  const { language, ready } = useAppPreferences();
  const active = has(productId);

  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} onClick={() => toggleCompare(productId)}>
      <span suppressHydrationWarning>
        {ready ? (active ? t("compareAdded", language) : t("addToCompare", language)) : active ? "Compare added" : "Add to compare"}
      </span>
    </Button>
  );
}
