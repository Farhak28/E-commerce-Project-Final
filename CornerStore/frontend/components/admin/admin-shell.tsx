"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAppPreferences } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useAdminI18n, type AdminI18nKey } from "@/lib/admin/use-admin-i18n";
import { t as storeT } from "@/lib/i18n";

type NavItem = {
  href: string;
  labelKey: AdminI18nKey;
  icon?: string;
  exact?: boolean;
};

type NavSection = {
  titleKey: AdminI18nKey;
  items: NavItem[];
};

const NAV: NavSection[] = [
  {
    titleKey: "navOverview",
    items: [
      { href: "/admin", labelKey: "navDashboard", icon: "◉", exact: true },
      { href: "/admin/reports", labelKey: "navReports", icon: "◫" },
    ],
  },
  {
    titleKey: "navCommerce",
    items: [
      { href: "/admin/products", labelKey: "navProducts", icon: "▦" },
      { href: "/admin/inventory", labelKey: "navInventory", icon: "▥" },
      { href: "/admin/orders", labelKey: "navOrders", icon: "◎" },
      { href: "/admin/returns", labelKey: "navReturns", icon: "↩" },
      { href: "/admin/coupons", labelKey: "navCoupons", icon: "◈" },
      { href: "/admin/shipping", labelKey: "navShipping", icon: "⧉" },
      { href: "/admin/users", labelKey: "navCustomers", icon: "◌" },
      { href: "/admin/reviews", labelKey: "navReviews", icon: "★" },
    ],
  },
  {
    titleKey: "navAiAssistant",
    items: [
      { href: "/admin/ai", labelKey: "navAiOverview", icon: "✦" },
      { href: "/admin/ai/knowledge", labelKey: "navKnowledgeBase", icon: "▤" },
      { href: "/admin/ai/chunks", labelKey: "navChunkViewer", icon: "▧" },
      { href: "/admin/ai/faq", labelKey: "navFaqManagement", icon: "?" },
      { href: "/admin/ai/analytics", labelKey: "navChatAnalytics", icon: "◫" },
      { href: "/admin/ai/recommendations", labelKey: "navRecommendations", icon: "↗" },
      { href: "/admin/ai/visual-search", labelKey: "navVisualSearch", icon: "⌕" },
      { href: "/admin/ai/logs", labelKey: "navConversationLogs", icon: "☰" },
      { href: "/admin/ai/config", labelKey: "navAiConfiguration", icon: "⚙" },
    ],
  },
  {
    titleKey: "navPlatform",
    items: [
      { href: "/admin/system", labelKey: "navSystemHealth", icon: "◍" },
      { href: "/admin/audit", labelKey: "navAuditLogs", icon: "▣" },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut, session } = useAuth();
  const { theme, toggleTheme } = useAppPreferences();
  const { t, language, toggleLanguage } = useAdminI18n();

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[260px_1fr] lg:gap-0">
      <aside className="mb-6 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm lg:mb-0 lg:min-h-full lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:rounded-none lg:border-r lg:border-y-0 lg:bg-surface/60 lg:p-5">
        <div className="mb-6 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t("cornerStore")}</p>
          <h2 className="section-title mt-1 text-lg font-bold">{t("adminConsole")}</h2>
          {session?.email ? (
            <p className="mt-1 truncate text-xs text-text-muted">{session.email}</p>
          ) : null}
        </div>

        <nav className="space-y-5">
          {NAV.map((section) => (
            <div key={section.titleKey}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted hover:bg-surface-2 hover:text-foreground"
                        }`}
                      >
                        {item.icon ? <span className="text-xs opacity-70">{item.icon}</span> : null}
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 space-y-2 border-t border-border pt-4">
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {t("backToStorefront")}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {language === "en" ? "AR" : "EN"}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {theme === "dark" ? storeT("lightMode", language) : storeT("darkMode", language)}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {t("signOut")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-1 pb-8 lg:px-8 lg:py-6">{children}</main>
    </div>
  );
}
