"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as cartService from "@/lib/services/cart";
import type { BasketDTO, CartLineItem, Product } from "@/lib/types";
import { mapProductDTO } from "@/lib/utils/product";
import { getOrCreateBasketId, clearBasketId } from "@/lib/utils/basket";
import { getProductById } from "@/lib/services/products";
import { resolvePictureUrl } from "@/lib/utils/images";

type CartContextValue = {
  basketId: string | null;
  lineItems: CartLineItem[];
  isLoading: boolean;
  error: string | null;
  addToCart: (productId: number, qty?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  setQty: (productId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncBasket: (
    deliveryMethodId?: number | null,
    scheduledDeliveryAt?: string | null,
    shippingPrice?: number | null,
  ) => Promise<BasketDTO>;
  setDeliveryMethod: (
    deliveryMethodId: number,
    scheduledDeliveryAt?: string | null,
    shippingPrice?: number | null,
  ) => Promise<void>;
  cartCount: number;
  subtotal: number;
  shippingPrice: number;
  discountAmount: number;
  basket: BasketDTO | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function basketToLineItems(basket: BasketDTO): CartLineItem[] {
  return basket.items.map((item) => ({
    product: {
      id: item.id,
      name: item.productName ?? "Product",
      description: "",
      pictureUrl: resolvePictureUrl(item.pictureUrl ?? ""),
      price: item.price,
      productType: "",
      productBrand: "",
    },
    qty: item.quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistBasket = useCallback(async (next: BasketDTO) => {
    const saved = await cartService.saveBasket(next);
    setBasket(saved);
    return saved;
  }, []);

  const refreshCart = useCallback(async () => {
    const id = getOrCreateBasketId();
    if (!id) return;
    try {
      setError(null);
      const data = await cartService.getBasket(id);
      setBasket(data);
    } catch {
      setBasket((prev) =>
        prev?.id === id && (prev.items.length > 0 || prev.paymentIntentID)
          ? prev
          : {
              id,
              items: [],
              deliveryMethodId: null,
              shippingPrice: 0,
              paymentIntentID: null,
              clientSecret: null,
            },
      );
    }
  }, []);

  const syncBasket = useCallback(
    async (
      deliveryMethodId?: number | null,
      scheduledDeliveryAt?: string | null,
      shippingPrice?: number | null,
    ) => {
      const basketId = getOrCreateBasketId();
      if (!basket?.items.length) {
        throw new Error("Your cart is empty.");
      }
      const saved = await persistBasket({
        ...basket,
        id: basketId,
        deliveryMethodId: deliveryMethodId ?? basket.deliveryMethodId,
        scheduledDeliveryAt:
          scheduledDeliveryAt === undefined ? basket.scheduledDeliveryAt ?? null : scheduledDeliveryAt,
        shippingPrice: shippingPrice ?? basket.shippingPrice,
      });
      return saved;
    },
    [basket, persistBasket],
  );

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshCart();
      setIsLoading(false);
    })();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: number, qty = 1) => {
      const basketId = getOrCreateBasketId();
      let current = basket ?? {
        id: basketId,
        items: [],
        deliveryMethodId: null,
        shippingPrice: 0,
        paymentIntentID: null,
        clientSecret: null,
      };

      const existing = current.items.find((i) => i.id === productId);
      let items = [...current.items];

      if (existing) {
        items = items.map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity + qty } : i,
        );
      } else {
        const product = await getProductById(productId);
        const mapped = mapProductDTO(product);
        items.push({
          id: productId,
          productName: mapped.name,
          pictureUrl: product.pictureUrl,
          price: mapped.price,
          quantity: qty,
        });
      }

      try {
        setError(null);
        await persistBasket({ ...current, id: basketId, items });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add to cart");
      }
    },
    [basket, persistBasket],
  );

  const removeFromCart = useCallback(
    async (productId: number) => {
      if (!basket) return;
      const items = basket.items.filter((i) => i.id !== productId);
      try {
        await persistBasket({ ...basket, items });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove item");
      }
    },
    [basket, persistBasket],
  );

  const setQty = useCallback(
    async (productId: number, qty: number) => {
      if (!basket) return;
      if (qty < 1) {
        await removeFromCart(productId);
        return;
      }
      const items = basket.items.map((i) =>
        i.id === productId ? { ...i, quantity: qty } : i,
      );
      try {
        await persistBasket({ ...basket, items });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update quantity");
      }
    },
    [basket, persistBasket, removeFromCart],
  );

  const clearCart = useCallback(async () => {
    if (!basket?.id) return;
    try {
      await cartService.deleteBasket(basket.id);
      clearBasketId();
      setBasket(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear cart");
    }
  }, [basket]);

  const setDeliveryMethod = useCallback(
    async (
      deliveryMethodId: number,
      scheduledDeliveryAt?: string | null,
      shippingPrice?: number | null,
    ) => {
      if (!basket) return;
      try {
        await persistBasket({
          ...basket,
          deliveryMethodId,
          scheduledDeliveryAt: scheduledDeliveryAt ?? null,
          ...(shippingPrice != null ? { shippingPrice } : {}),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to set delivery method");
      }
    },
    [basket, persistBasket],
  );

  const lineItems = useMemo(() => (basket ? basketToLineItems(basket) : []), [basket]);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, { product, qty }) => sum + product.price * qty, 0),
    [lineItems],
  );

  const cartCount = useMemo(
    () => lineItems.reduce((s, l) => s + l.qty, 0),
    [lineItems],
  );

  const value = useMemo(
    () => ({
      basketId: basket?.id ?? null,
      lineItems,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      refreshCart,
      syncBasket,
      setDeliveryMethod,
      cartCount,
      subtotal,
      shippingPrice: basket?.shippingPrice ?? 0,
      discountAmount: basket?.discountAmount ?? 0,
      basket,
    }),
    [
      basket,
      lineItems,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      refreshCart,
      syncBasket,
      setDeliveryMethod,
      cartCount,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
