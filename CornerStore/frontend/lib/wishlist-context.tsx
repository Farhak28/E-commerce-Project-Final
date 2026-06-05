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
import * as wishlistService from "@/lib/services/wishlist";
import { useAuth } from "@/lib/auth-context";

type WishlistContextValue = {
  ids: number[];
  isLoading: boolean;
  error: string | null;
  add: (productId: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  has: (productId: number) => boolean;
  count: number;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [ids, setIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setIds([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setIds(data.productIds ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
      setIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: number) => {
      if (!isSignedIn) {
        setError("Sign in to save items to your wishlist.");
        return;
      }
      setIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      try {
        const data = await wishlistService.addToWishlist(productId);
        setIds(data.productIds ?? []);
        setError(null);
      } catch (e) {
        setIds((prev) => prev.filter((id) => id !== productId));
        setError(e instanceof Error ? e.message : "Failed to add to wishlist");
      }
    },
    [isSignedIn],
  );

  const remove = useCallback(
    async (productId: number) => {
      if (!isSignedIn) return;
      setIds((prev) => prev.filter((id) => id !== productId));
      try {
        const data = await wishlistService.removeFromWishlist(productId);
        setIds(data.productIds ?? []);
        setError(null);
      } catch (e) {
        await refresh();
        setError(e instanceof Error ? e.message : "Failed to remove from wishlist");
      }
    },
    [isSignedIn, refresh],
  );

  const toggle = useCallback(
    async (productId: number) => {
      if (!isSignedIn) {
        setError("Sign in to save items to your wishlist.");
        return;
      }
      const inList = ids.includes(productId);
      if (inList) await remove(productId);
      else await add(productId);
    },
    [ids, add, remove, isSignedIn],
  );

  const has = useCallback((productId: number) => ids.includes(productId), [ids]);

  const value = useMemo(
    () => ({
      ids,
      isLoading,
      error,
      add,
      remove,
      toggle,
      has,
      count: ids.length,
      refresh,
      clearError: () => setError(null),
    }),
    [ids, isLoading, error, add, remove, toggle, has, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
