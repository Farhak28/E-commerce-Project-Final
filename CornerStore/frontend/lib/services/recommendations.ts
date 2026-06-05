import { apiClient } from "@/lib/services/api-client";
import type { ProductDTO } from "@/lib/types";

function idsParam(ids: number[]): string | undefined {
  const filtered = ids.filter((id) => id > 0);
  return filtered.length ? filtered.join(",") : undefined;
}

export async function getTrendingProducts(count = 8) {
  return apiClient<ProductDTO[]>("/Recommendations/trending", {
    params: { count },
    skipAuth: true,
  });
}

export async function getSimilarProducts(productId: number, count = 5) {
  return apiClient<ProductDTO[]>(`/Recommendations/similar/${productId}`, {
    params: { count },
    skipAuth: true,
  });
}

export async function getSimilarPriceProducts(productId: number, count = 6) {
  return apiClient<ProductDTO[]>(`/Recommendations/similar-price/${productId}`, {
    params: { count },
    skipAuth: true,
  });
}

export async function getPersonalizedProducts(
  count = 8,
  options?: { cartIds?: number[]; recentIds?: number[] },
) {
  return apiClient<ProductDTO[]>("/Recommendations/personalized", {
    params: {
      count,
      cartIds: idsParam(options?.cartIds ?? []),
      recentIds: idsParam(options?.recentIds ?? []),
    },
  });
}

export async function getPersonalizedProductsGuest(
  count = 8,
  options?: { cartIds?: number[]; recentIds?: number[] },
) {
  return apiClient<ProductDTO[]>("/Recommendations/personalized/guest", {
    params: {
      count,
      cartIds: idsParam(options?.cartIds ?? []),
      recentIds: idsParam(options?.recentIds ?? []),
    },
    skipAuth: true,
  });
}

export async function getRecommendationsForProducts(productIds: number[], count = 8) {
  return apiClient<ProductDTO[]>("/Recommendations/for-products", {
    params: { productIds: idsParam(productIds), count },
    skipAuth: true,
  });
}

export async function getProductsByBudget(maxPrice: number, count = 8) {
  return apiClient<ProductDTO[]>("/Recommendations/by-budget", {
    params: { maxPrice, count },
    skipAuth: true,
  });
}

export async function getProductsByCategory(category: string, count = 8) {
  return apiClient<ProductDTO[]>("/Recommendations/by-category", {
    params: { category, count },
    skipAuth: true,
  });
}

export async function trackRecommendationClick(source: string, productId: number) {
  return apiClient<void>("/Recommendations/track-click", {
    method: "POST",
    body: JSON.stringify({ source, productId }),
    skipAuth: true,
  });
}
