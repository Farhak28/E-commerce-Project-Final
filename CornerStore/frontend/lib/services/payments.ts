import { apiClient } from "@/lib/services/api-client";
import type { BasketDTO } from "@/lib/types";

/** Read clientSecret from API response (camelCase or legacy PascalCase). */
export function readClientSecret(basket: BasketDTO | Record<string, unknown>): string | null {
  const secret =
    (basket as BasketDTO).clientSecret
    ?? (basket as Record<string, unknown>).ClientSecret
    ?? (basket as Record<string, unknown>).client_secret;
  return typeof secret === "string" && secret.trim() ? secret.trim() : null;
}

export async function createOrUpdatePaymentIntent(basketId: string): Promise<BasketDTO> {
  const basket = await apiClient<BasketDTO>(`/Payments/${basketId}`, { method: "POST" });
  const secret = readClientSecret(basket);
  return secret ? { ...basket, clientSecret: secret } : basket;
}

export async function isPaymentComplete(basketId: string): Promise<boolean> {
  return apiClient<boolean>(`/Payments/${basketId}/payment-status`);
}
