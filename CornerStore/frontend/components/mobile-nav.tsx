"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare-context";
import { useCart } from "@/lib/cart-context";
import { useAssistant } from "@/lib/assistant-context";
import { t } from "@/lib/i18n";
import { useAppPreferences } from "@/components/theme-provider";

const items = [
  { href: "/", labelKey: "home" as const, icon: "⌂" },
  { href: "/categories", labelKey: "categories" as const, icon: "▦" },
  { href: "/cart", labelKey: "cart" as const, icon: "🛒", badge: "cart" as const },
  { href: "/wishlist", labelKey: "wishlist" as const, icon: "♥" },
  { href: "/account", labelKey: "account" as const, icon: "👤" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { compareIds } = useCompare();
  const { toggle: toggleAssistant } = useAssistant();
  const { language, ready } = useAppPreferences();

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-strong pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile navigation"
      >
        <ul className="flex h-[var(--mobile-nav-height)] items-stretch justify-around">
          {items.map((item) => {
            const active = pathname === item.href;
            const badge = item.badge === "cart" && cartCount > 0 ? cartCount : null;
            return (
              <li key={item.href} className="flex flex-1">
                <Link
                  href={item.href}
                  className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                    active ? "text-primary" : "text-text-muted"
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>{item.icon}</span>
                  <span suppressHydrationWarning>{ready ? t(item.labelKey, language) : item.labelKey}</span>
                  {badge ? (
                    <span className="absolute right-[calc(50%-18px)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={toggleAssistant}
        className="fixed bottom-[calc(var(--mobile-nav-height)+1rem)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl text-white shadow-[var(--shadow-glow)] transition hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        aria-label="Open AI shopping assistant"
      >
        ✦
        {compareIds.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold">
            {compareIds.length}
          </span>
        ) : null}
      </button>
    </>
  );
}
