import { apiClient } from "@/lib/services/api-client";
import type { AccountDashboardDTO, BasketDTO, UserCouponDTO } from "@/lib/types";

export async function getAccountDashboard(): Promise<AccountDashboardDTO> {
  return apiClient<AccountDashboardDTO>("/Account/dashboard");
}

export async function getAccountCoupons(): Promise<UserCouponDTO[]> {
  return apiClient<UserCouponDTO[]>("/Account/coupons");
}

export async function applyAccountCoupon(basketId: string, code: string): Promise<BasketDTO> {
  return apiClient<BasketDTO>("/Account/coupons/apply", {
    method: "POST",
    body: JSON.stringify({ basketId, code }),
  });
}

export async function removeAccountCoupon(basketId: string): Promise<BasketDTO> {
  return apiClient<BasketDTO>(`/Account/coupons/basket/${basketId}`, {
    method: "DELETE",
  });
}
