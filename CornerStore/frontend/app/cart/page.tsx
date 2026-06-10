"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, EmptyState, Input, Skeleton } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { useAppPreferences } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { t } from "@/lib/i18n";
import { RecommendedProducts } from "@/components/recommended-products";
import {
  applyAccountCoupon,
  getAccountCoupons,
  removeAccountCoupon,
} from "@/lib/services/account";
import type { UserCouponDTO } from "@/lib/types";

export default function CartPage() {
  const router = useRouter();
  const { language } = useAppPreferences();
  const { isSignedIn } = useAuth();
  const { lineItems, setQty, removeFromCart, subtotal, discountAmount, basket, refreshCart } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [myCoupons, setMyCoupons] = useState<UserCouponDTO[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setMyCoupons([]);
      return;
    }
    setCouponsLoading(true);
    void getAccountCoupons()
      .then((list) => setMyCoupons(list.filter((c) => !c.isUsed && new Date(c.expiresAt) > new Date())))
      .catch(() => setMyCoupons([]))
      .finally(() => setCouponsLoading(false));
  }, [isSignedIn]);

  const shipping = basket?.shippingPrice ?? 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);
  const appliedCode = basket?.couponCode ?? null;

  const applyCartCoupon = async (code?: string) => {
    const value = (code ?? couponInput).trim().toUpperCase();
    if (!value) {
      setCouponMsg(language === "ar" ? "أدخل رمزاً" : "Enter a code");
      return;
    }
    if (!isSignedIn || !basket?.id) {
      setCouponMsg(language === "ar" ? "سجّل الدخول لتطبيق القسائم" : "Sign in to apply coupons.");
      return;
    }

    setCouponLoading(true);
    setCouponMsg(null);
    try {
      await applyAccountCoupon(basket.id, value);
      await refreshCart();
      setCouponInput(value);
    } catch (e) {
      setCouponMsg(e instanceof Error ? e.message : "Could not apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async () => {
    if (!basket?.id) return;
    setCouponLoading(true);
    try {
      await removeAccountCoupon(basket.id);
      await refreshCart();
      setCouponInput("");
      setCouponMsg(null);
    } catch (e) {
      setCouponMsg(e instanceof Error ? e.message : "Could not remove coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const lineCount = useMemo(() => lineItems.reduce((s, l) => s + l.qty, 0), [lineItems]);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="animate-rise">
        <h1 className="section-title text-3xl font-bold">{t("cart", language)}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {lineCount > 0 ? `${lineCount} ${language === "ar" ? "عناصر" : "items"}` : t("cartEmpty", language)} — {language === "ar" ? "راجع واستكمل الدفع عند الاستعداد." : "review and checkout when ready."}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          {lineItems.length === 0 ? (
            <EmptyState
              icon="🛒"
              title={language === "ar" ? "سلتك فارغة" : "Your cart is empty"}
              description={t("cartEmpty", language)}
              action={
                <Link href="/products">
                  <Button>{t("continueShoppingCart", language)}</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {lineItems.map(({ product, qty }) => (
                <div key={product.id} className="rounded-xl bg-surface-2 p-4 transition hover:bg-primary/10">
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <Image src={product.pictureUrl} alt={product.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{product.name}</p>
                        <p className="shrink-0 text-sm font-semibold text-primary">${product.price * qty}</p>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-text-muted">{product.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs">
                          <button type="button" aria-label="Decrease" onClick={() => setQty(product.id, qty - 1)}>-</button>
                          <span>{qty}</span>
                          <button type="button" aria-label="Increase" onClick={() => setQty(product.id, qty + 1)}>+</button>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-text-muted underline"
                          onClick={() => removeFromCart(product.id)}
                        >
                          {t("remove", language)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="section-title text-xl font-semibold" suppressHydrationWarning>{language === "ar" ? "الملخص" : "Order summary"}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span suppressHydrationWarning>{t("subtotal", language)}</span><span>${subtotal.toFixed(2)}</span></p>
            {shipping > 0 ? (
              <p className="flex justify-between"><span suppressHydrationWarning>{language === "ar" ? "الشحن" : "Shipping"}</span><span>${shipping.toFixed(2)}</span></p>
            ) : null}
            {discountAmount > 0 ? (
              <p className="flex justify-between text-emerald-700 dark:text-emerald-300">
                <span suppressHydrationWarning>{language === "ar" ? "الخصم" : "Discount"}</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </p>
            ) : null}
            <p className="flex justify-between font-bold"><span suppressHydrationWarning>{t("total", language)}</span><span>${total.toFixed(2)}</span></p>
          </div>

          <div className="mt-4 space-y-2">
            {!isSignedIn ? (
              <p className="text-xs text-text-muted">
                <Link href="/login" className="font-semibold text-primary">Sign in</Link> to use loyalty coupons from your purchases.
              </p>
            ) : (
              <>
                <Input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponMsg(null);
                  }}
                  placeholder={language === "ar" ? "رمز القسيمة" : "Coupon code"}
                  suppressHydrationWarning
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    disabled={couponLoading || lineItems.length === 0}
                    onClick={() => void applyCartCoupon()}
                  >
                    {couponLoading ? "…" : language === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                  {appliedCode ? (
                    <Button type="button" variant="outline" disabled={couponLoading} onClick={() => void removeCoupon()}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                {couponsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : myCoupons.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Your rewards</p>
                    {myCoupons.slice(0, 3).map((coupon) => (
                      <button
                        key={coupon.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-left text-xs transition hover:border-primary/40"
                        onClick={() => void applyCartCoupon(coupon.code)}
                      >
                        <span>
                          <span className="font-semibold">{coupon.title}</span>
                          <span className="block text-text-muted">{coupon.discountLabel}</span>
                        </span>
                        <code className="shrink-0 font-bold">{coupon.code}</code>
                      </button>
                    ))}
                    <Link href="/account/coupons" className="text-xs font-semibold text-primary">
                      View all coupons
                    </Link>
                  </div>
                ) : (
                  <Link href="/account/coupons" className="text-xs font-semibold text-primary">
                    View loyalty coupons
                  </Link>
                )}
              </>
            )}
          </div>
          {appliedCode ? (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300" suppressHydrationWarning>
              {language === "ar" ? `تم تطبيق الرمز ${appliedCode}.` : `Code ${appliedCode} applied.`}
            </p>
          ) : null}
          {couponMsg ? <p className="text-xs text-accent">{couponMsg}</p> : null}
          <div className="mt-4">
            <Button
              type="button"
              className="w-full"
              disabled={lineItems.length === 0}
              onClick={() => router.push("/checkout")}
              suppressHydrationWarning
            >
              {t("checkout", language)}
            </Button>
          </div>
          <p className="mt-3 text-xs text-text-muted" suppressHydrationWarning>{language === "ar" ? "دفع آمن مع التشفير وتأكيد الطلب." : "Secure checkout with encryption and order confirmation."}</p>
        </Card>
      </div>

      {lineItems.length > 0 ? (
        <RecommendedProducts
          title={language === "ar" ? "يُشترى معاً بكثرة" : "Frequently bought together"}
          mode="cart"
          cartProductIds={lineItems.map((l) => l.product.id)}
          excludedIds={lineItems.map((l) => l.product.id)}
        />
      ) : null}
    </div>
  );
}
