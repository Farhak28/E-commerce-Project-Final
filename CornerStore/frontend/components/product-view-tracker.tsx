"use client";

import { useEffect } from "react";
import { addRecentlyViewed } from "@/lib/utils/recently-viewed";

export function ProductViewTracker({ productId }: { productId: number }) {
  useEffect(() => {
    addRecentlyViewed(productId);
  }, [productId]);
  return null;
}
