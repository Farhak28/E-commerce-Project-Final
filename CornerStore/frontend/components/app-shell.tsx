"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CategoryMegaMenu } from "@/components/category-mega-menu";
import { Footer } from "@/components/footer";
import { CompareBar } from "@/components/compare-bar";
import { MobileBottomNav } from "@/components/mobile-nav";
import { SmartSearch } from "@/components/smart-search";
import { useAppPreferences } from "@/components/theme-provider";
import { useCart } from "@/lib/cart-context";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useAssistant } from "@/lib/assistant-context";
import { useCompare } from "@/lib/compare-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getUnreadNotificationCount } from "@/lib/services/notifications";

function NavIcon({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
        active ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { toggleTheme, theme, toggleLanguage, language } = useAppPreferences();
  const { cartCount } = useCart();
  const { compareIds } = useCompare();
  const { count: wishlistCount } = useWishlist();
  const { isSignedIn, isAdmin, signOut } = useAuth();
  const { open: assistantOpen, toggle: toggleAssistant } = useAssistant();
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!isSignedIn) {
        if (!cancelled) setUnreadNotifications(0);
        return;
      }
      void getUnreadNotificationCount()
        .then((c) => { if (!cancelled) setUnreadNotifications(c); })
        .catch(() => { if (!cancelled) setUnreadNotifications(0); });
    };
    refresh();
    window.addEventListener("notifications:updated", refresh);
    window.addEventListener("auth:unauthorized", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications:updated", refresh);
      window.removeEventListener("auth:unauthorized", refresh);
    };
  }, [isSignedIn]);

  if (isAdminRoute) {
    return (
      <div className="min-h-screen text-text">
        <header className="sticky top-0 z-50 border-b border-border glass-strong">
          <div className="container-premium flex h-14 items-center justify-between">
            <Link href="/admin" className="section-title text-lg font-bold">Corner Store Admin</Link>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-lg border border-border px-2 py-1 text-xs" onClick={toggleTheme}>
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <Link href="/" className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-2">Storefront</Link>
            </div>
          </div>
        </header>
        <main className="container-premium py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-mobile-nav text-text md:pb-0">
      <header className="sticky top-0 z-50 border-b border-border glass-strong">
        <div className="container-premium flex h-[var(--nav-height)] items-center gap-4">
          <Link href="/" className="section-title shrink-0 text-xl font-bold tracking-tight">
            Corner<span className="text-primary">Store</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/" className={`text-sm font-medium ${pathname === "/" ? "text-primary" : "text-text-muted hover:text-text"}`}>
              <span suppressHydrationWarning>{t("home", language)}</span>
            </Link>
            <CategoryMegaMenu />
            <Link href="/products" className={`text-sm font-medium ${pathname.startsWith("/products") ? "text-primary" : "text-text-muted hover:text-text"}`}>
              <span suppressHydrationWarning>{t("products", language)}</span>
            </Link>
            <Link href="/visual-search" className="text-sm font-medium text-text-muted hover:text-text">
              <span suppressHydrationWarning>{t("visualSearch", language)}</span>
            </Link>
          </nav>

          <SmartSearch className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg" />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button type="button" className="hidden rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface-2 sm:inline-flex" onClick={toggleLanguage}>
              {language === "en" ? "AR" : "EN"}
            </button>
            <button type="button" className="hidden rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface-2 sm:inline-flex" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <NavIcon href="/compare" label="Compare" active={pathname === "/compare"} badge={compareIds.length}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </NavIcon>

            {isSignedIn ? (
              <NavIcon href="/wishlist" label="Wishlist" active={pathname === "/wishlist"} badge={wishlistCount}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </NavIcon>
            ) : null}

            <NavIcon href="/cart" label="Cart" active={pathname === "/cart"} badge={cartCount}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </NavIcon>

            <NavIcon href="/notifications" label="Notifications" active={pathname === "/notifications"} badge={unreadNotifications}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </NavIcon>

            <button
              type="button"
              onClick={toggleAssistant}
              className={`hidden rounded-xl px-3 py-2 text-sm font-semibold transition md:inline-flex ${
                assistantOpen ? "bg-primary text-white shadow-md shadow-primary/30" : "border border-primary/30 text-primary hover:bg-primary/5"
              }`}
              aria-expanded={assistantOpen}
            >
              ✦ <span suppressHydrationWarning>{t("aiChat", language)}</span>
            </button>

            {isSignedIn ? (
              <>
                <Link href="/account" className="hidden rounded-xl border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2 lg:inline-flex">
                  <span suppressHydrationWarning>{t("account", language)}</span>
                </Link>
                {isAdmin ? (
                  <Link href="/admin" className="hidden rounded-xl border border-border px-3 py-1.5 text-xs lg:inline-flex">Admin</Link>
                ) : null}
                <button type="button" className="hidden rounded-xl px-3 py-2 text-sm text-text-muted hover:bg-surface-2 lg:inline-flex" onClick={signOut}>
                  {language === "ar" ? "خروج" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2 sm:inline-flex">
                  <span suppressHydrationWarning>{t("signin", language)}</span>
                </Link>
                <Link href="/register" className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm sm:inline-flex">
                  <span suppressHydrationWarning>{t("register", language)}</span>
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="container-premium pb-3 md:hidden">
          <SmartSearch />
        </div>
      </header>

      <main className="container-premium py-8 md:py-10">{children}</main>
      <CompareBar />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
