import { apiClient } from "@/lib/services/api-client";
import type { WishlistDTO } from "@/lib/types";

export async function getWishlist(): Promise<WishlistDTO> {
  return apiClient<WishlistDTO>("/Wishlists");
}

export async function addToWishlist(productId: number): Promise<WishlistDTO> {
  return apiClient<WishlistDTO>(`/Wishlists/${productId}`, { method: "POST" });
}

export async function removeFromWishlist(productId: number): Promise<WishlistDTO> {
  return apiClient<WishlistDTO>(`/Wishlists/${productId}`, { method: "DELETE" });
}

export async function clearWishlist(): Promise<void> {
  return apiClient<void>("/Wishlists", { method: "DELETE" });
}
