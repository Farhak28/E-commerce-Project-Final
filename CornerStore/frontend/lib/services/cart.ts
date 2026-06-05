import { apiClient } from "@/lib/services/api-client";
import type { BasketDTO } from "@/lib/types";

export async function getBasket(basketId: string): Promise<BasketDTO> {
  return apiClient<BasketDTO>("/Baskets", {
    params: { basketId },
    skipAuth: true,
  });
}

export async function saveBasket(basket: BasketDTO): Promise<BasketDTO> {
  return apiClient<BasketDTO>("/Baskets", {
    method: "POST",
    body: JSON.stringify(basket),
    skipAuth: true,
  });
}

export async function deleteBasket(basketId: string): Promise<boolean> {
  return apiClient<boolean>(`/Baskets/${basketId}`, {
    method: "DELETE",
    skipAuth: true,
  });
}
