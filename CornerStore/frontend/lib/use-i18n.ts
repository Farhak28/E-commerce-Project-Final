"use client";

import { useMemo } from "react";
import { useAppPreferences } from "@/components/theme-provider";
import { t, type I18nKey, type Language } from "@/lib/i18n";

export type { I18nKey };

export function useI18n() {
  const { language, ready } = useAppPreferences();

  return useMemo(
    () => ({
      language,
      ready,
      t: (key: I18nKey, vars?: Record<string, string | number>) => t(key, language, vars),
    }),
    [language, ready],
  );
}

export function useLocaleCode(language: Language): string {
  return language === "ar" ? "ar-EG" : "en-US";
}
