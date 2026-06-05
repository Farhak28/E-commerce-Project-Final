"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useCart } from "@/lib/cart-context";

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
    </div>
  );
}
