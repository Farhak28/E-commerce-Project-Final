"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import { RecommendedProducts } from "@/components/recommended-products";

const CART_COUPONS: Record<string, number> = { NOVA20: 0.2, SAVE10: 0.1 };

export default function CartPage() {
  const router = useRouter();
  const { language } = useAppPreferences();
  const { lineItems, setQty, removeFromCart, subtotal } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const discountRate = applied ? CART_COUPONS[applied] ?? 0 : 0;
  const discount = Math.round(subtotal * discountRate);
  const shipping = lineItems.length > 0 ? 12 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyCartCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setApplied(null);
      setCouponMsg(language === "ar" ? "أدخل رمزاً" : "Enter a code");
      return;
    }
    if (CART_COUPONS[code] !== undefined) {
      setApplied(code);
      setCouponMsg(null);
    } else {
      setApplied(null);
      setCouponMsg(language === "ar" ? "رمز غير صحيح. استخدم NOVA20 أو SAVE10." : "Invalid code. Use NOVA20 or SAVE10.");
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
            <p className="flex justify-between"><span suppressHydrationWarning>{t("subtotal", language)}</span><span>${subtotal}</span></p>
            <p className="flex justify-between"><span suppressHydrationWarning>{language === "ar" ? "الشحن" : "Shipping"}</span><span>${shipping}</span></p>
            <p className="flex justify-between"><span suppressHydrationWarning>{language === "ar" ? "الخصم" : "Discount"}</span><span>-${discount}</span></p>
            <p className="flex justify-between font-bold"><span suppressHydrationWarning>{t("total", language)}</span><span>${total}</span></p>
          </div>
          <div className="mt-4 space-y-2">
            <Input
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponMsg(null);
              }}
              placeholder={language === "ar" ? "رمز القسيمة" : "Coupon code"}
              suppressHydrationWarning
            />
            <Button type="button" variant="ghost" className="w-full" onClick={applyCartCoupon}>
              {language === "ar" ? "تطبيق" : "Apply"}
            </Button>
          </div>
          {applied ? <p className="text-xs text-secondary" suppressHydrationWarning>{language === "ar" ? `تم تطبيق الرمز ${applied}.` : `Code ${applied} applied.`}</p> : null}
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

