"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/use-i18n";

function scrollToReviews() {
  window.dispatchEvent(new CustomEvent("product:open-reviews-tab"));
  requestAnimationFrame(() => {
    document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function ProductPurchaseActions({ productId }: { productId: number }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button type="button" onClick={() => void addToCart(productId, 1)}>
        <span suppressHydrationWarning>{t("addToCart")}</span>
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void addToCart(productId, 1);
          router.push("/checkout");
        }}
      >
        <span suppressHydrationWarning>{t("buyNow")}</span>
      </Button>
      <Button type="button" variant="ghost" onClick={() => router.push("/cart")}>
        <span suppressHydrationWarning>{t("viewCart")}</span>
      </Button>
      <Button type="button" variant="ghost" onClick={scrollToReviews}>
        <span suppressHydrationWarning>{t("rateAndReview")}</span>
      </Button>
    </div>
  );
}
