"use client";

import { useMemo } from "react";
import { useAppPreferences } from "@/components/theme-provider";
import { adminT, type AdminI18nKey } from "@/lib/admin/i18n";

export type { AdminI18nKey };

export function useAdminI18n() {
  const { language, ready, toggleLanguage } = useAppPreferences();

  return useMemo(
    () => ({
      language,
      ready,
      toggleLanguage,
      t: (key: AdminI18nKey, vars?: Record<string, string | number>) => adminT(key, language, vars),
    }),
    [language, ready, toggleLanguage],
  );
}
