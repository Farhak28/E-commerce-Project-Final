/** Future-ready admin i18n keys — extend with additional locales as needed */
export const adminI18n = {
  en: {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    aiOverview: "AI Overview",
    knowledgeBase: "Knowledge Base",
    systemHealth: "System Health",
  },
} as const;

export type AdminLocale = keyof typeof adminI18n;

export function adminT(key: keyof (typeof adminI18n)["en"], locale: AdminLocale = "en"): string {
  return adminI18n[locale][key];
}

/** Feature flags for future multi-vendor, voice, and multi-provider AI */
export const adminFeatures = {
  multiVendor: false,
  voiceCommerce: false,
  multiAiProvider: false,
  supportedAiProviders: ["google-gemini"] as const,
  defaultLocale: "en" as AdminLocale,
};
