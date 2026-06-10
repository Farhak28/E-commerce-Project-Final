"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useCart } from "@/lib/cart-context";

function scrollToReviews() {
  window.dispatchEvent(new CustomEvent("product:open-reviews-tab"));
  requestAnimationFrame(() => {
    document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function ProductPurchaseActions({ productId }: { productId: number }) {
  const { addToCart } = useCart();
  const router = useRouter();

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button type="button" onClick={() => void addToCart(productId, 1)}>
        Add to cart
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          void addToCart(productId, 1);
          router.push("/checkout");
        }}
      >
        Buy now
      </Button>
      <Button type="button" variant="ghost" onClick={() => router.push("/cart")}>
        View cart
      </Button>
      <Button type="button" variant="ghost" onClick={scrollToReviews}>
        Rate &amp; review
      </Button>
    </div>
  );
}
