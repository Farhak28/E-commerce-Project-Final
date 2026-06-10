"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAppPreferences } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";

type NavItem = {
  href: string;
  label: string;
  icon?: string;
  exact?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "◉", exact: true },
      { href: "/admin/reports", label: "Reports", icon: "◫" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/products", label: "Products", icon: "▦" },
      { href: "/admin/inventory", label: "Inventory", icon: "▥" },
      { href: "/admin/orders", label: "Orders", icon: "◎" },
      { href: "/admin/coupons", label: "Coupons", icon: "◈" },
      { href: "/admin/users", label: "Customers", icon: "◌" },
      { href: "/admin/reviews", label: "Reviews", icon: "★" },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      { href: "/admin/ai", label: "AI Overview", icon: "✦" },
      { href: "/admin/ai/knowledge", label: "Knowledge Base", icon: "▤" },
      { href: "/admin/ai/chunks", label: "Chunk Viewer", icon: "▧" },
      { href: "/admin/ai/faq", label: "FAQ Management", icon: "?" },
      { href: "/admin/ai/analytics", label: "Chat Analytics", icon: "◫" },
      { href: "/admin/ai/recommendations", label: "Recommendations", icon: "↗" },
      { href: "/admin/ai/visual-search", label: "Visual Search", icon: "⌕" },
      { href: "/admin/ai/logs", label: "Conversation Logs", icon: "☰" },
      { href: "/admin/ai/config", label: "AI Configuration", icon: "⚙" },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/admin/system", label: "System Health", icon: "◍" },
      { href: "/admin/audit", label: "Audit Logs", icon: "▣" },
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

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[260px_1fr] lg:gap-0">
      <aside className="mb-6 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm lg:mb-0 lg:min-h-full lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:rounded-none lg:border-r lg:border-y-0 lg:bg-surface/60 lg:p-5">
        <div className="mb-6 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Corner Store</p>
          <h2 className="section-title mt-1 text-lg font-bold">Admin Console</h2>
          {session?.email ? (
            <p className="mt-1 truncate text-xs text-text-muted">{session.email}</p>
          ) : null}
        </div>

        <nav className="space-y-5">
          {NAV.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
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
                        {item.label}
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
            ← Back to storefront
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-2 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-1 pb-8 lg:px-8 lg:py-6">{children}</main>
    </div>
  );
}
