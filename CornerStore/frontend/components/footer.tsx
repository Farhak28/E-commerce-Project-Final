"use client";

import Link from "next/link";
import { useAppPreferences } from "@/components/theme-provider";
import { AiShowcaseBadges } from "@/components/ai-showcase-badges";
import { t } from "@/lib/i18n";

const shopLinks = [
  { href: "/products", labelKey: "products" as const },
  { href: "/categories", labelKey: "categories" as const },
  { href: "/wishlist", labelKey: "wishlist" as const },
  { href: "/compare", labelKey: "compare" as const },
  { href: "/visual-search", labelKey: "visualSearch" as const },
];

const supportLinks = [
  { href: "/help", label: "Help & AI Assistant" },
  { href: "/account/orders", label: "Track orders" },
  { href: "/notifications", labelKey: "notifications" as const },
];

export function Footer() {
  const { language, ready } = useAppPreferences();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-surface/60 backdrop-blur-md">
      <div className="container-premium py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="section-title text-xl font-bold">
              Corner<span className="text-primary">Store</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted" suppressHydrationWarning>
              {ready ? t("footerTagline", language) : "Premium commerce with intelligent AI assistance, personalized recommendations, and a seamless checkout experience."}
            </p>
            <div className="mt-4">
              <AiShowcaseBadges compact />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" suppressHydrationWarning>{ready ? t("footerExplore", language) : "Shop"}</p>
            <ul className="mt-4 space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-muted transition hover:text-primary">
                    <span suppressHydrationWarning>{t(link.labelKey, language)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Support</p>
            <ul className="mt-4 space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-muted transition hover:text-primary">
                    {"labelKey" in link && link.labelKey ? (
                      <span suppressHydrationWarning>{t(link.labelKey, language)}</span>
                    ) : (
                      link.label
                    )}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/account" className="text-sm text-text-muted transition hover:text-primary">
                  <span suppressHydrationWarning>{t("account", language)}</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold" suppressHydrationWarning>{ready ? t("status", language) : "Platform"}</p>
            <p className="mt-4 text-sm leading-relaxed text-text-muted" suppressHydrationWarning>
              {ready ? t("footerStatus", language) : "AI-powered recommendations, smart search, dark mode, and bilingual EN/AR support."}
            </p>
            <div className="mt-4 flex flex-wrap gap-0.5 text-xs text-text-muted">
              <span className="rounded-md bg-surface-2 px-2 py-1">Next.js</span>
              <span className="rounded-md bg-surface-2 px-2 py-1">Gemini AI</span>
              <span className="rounded-md bg-surface-2 px-2 py-1">RAG</span>
              <span className="rounded-md bg-surface-2 px-2 py-1">Stripe</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-text-muted sm:flex-row">
          <p>© {year} Corner Store. All rights reserved.</p>
          <p>Built for graduation showcase — production-ready e-commerce + AI.</p>
        </div>
      </div>
    </footer>
  );
}
