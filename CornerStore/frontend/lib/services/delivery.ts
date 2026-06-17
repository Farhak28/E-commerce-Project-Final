import { apiClient } from "@/lib/services/api-client";
import type {
  AdminShippingConfigDTO,
  AvailableDeliveryDateDTO,
  BlockedDeliveryDateDTO,
  CreateBlockedDeliveryDateRequest,
  CreateDeliveryHolidayRequest,
  DeliveryHolidayDTO,
  DeliveryQuoteDTO,
  DeliverySchedulingSettingsDTO,
  DeliveryTimeSlotAdminDTO,
  DeliveryTimeSlotDTO,
  DeliveryType,
  UpdateDeliverySchedulingSettingsRequest,
  UpsertDeliveryTimeSlotRequest,
} from "@/lib/types";

export type DeliveryQuoteParams = {
  deliveryType?: DeliveryType;
  scheduledDeliveryAt?: string | null;
  scheduledDate?: string | null;
  deliveryTimeSlotId?: number | null;
};

export async function getDeliverySettings(): Promise<DeliverySchedulingSettingsDTO> {
  return apiClient<DeliverySchedulingSettingsDTO>("/Orders/deliverySettings", { skipAuth: true });
}

export async function getAvailableDeliveryDates(
  deliveryMethodId: number,
): Promise<AvailableDeliveryDateDTO[]> {
  return apiClient<AvailableDeliveryDateDTO[]>("/Orders/availableDates", {
    skipAuth: true,
    params: { deliveryMethodId },
  });
}

export async function getDeliveryTimeSlots(
  deliveryMethodId: number,
  date: string,
): Promise<DeliveryTimeSlotDTO[]> {
  return apiClient<DeliveryTimeSlotDTO[]>("/Orders/timeSlots", {
    skipAuth: true,
    params: { deliveryMethodId, date },
  });
}

export async function getDeliveryQuote(
  deliveryMethodId: number,
  params: DeliveryQuoteParams = {},
): Promise<DeliveryQuoteDTO> {
  return apiClient<DeliveryQuoteDTO>("/Orders/deliveryQuote", {
    skipAuth: true,
    params: {
      deliveryMethodId,
      ...(params.deliveryType ? { deliveryType: params.deliveryType } : {}),
      ...(params.scheduledDeliveryAt ? { scheduledDeliveryAt: params.scheduledDeliveryAt } : {}),
      ...(params.scheduledDate ? { scheduledDate: params.scheduledDate } : {}),
      ...(params.deliveryTimeSlotId ? { deliveryTimeSlotId: params.deliveryTimeSlotId } : {}),
    },
  });
}

export async function getAdminShippingConfig(): Promise<AdminShippingConfigDTO> {
  return apiClient<AdminShippingConfigDTO>("/Admin/shipping");
}

export async function updateAdminShippingSettings(
  request: UpdateDeliverySchedulingSettingsRequest,
): Promise<DeliverySchedulingSettingsDTO> {
  return apiClient<DeliverySchedulingSettingsDTO>("/Admin/shipping/settings", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function createAdminTimeSlot(
  request: UpsertDeliveryTimeSlotRequest,
): Promise<DeliveryTimeSlotAdminDTO> {
  return apiClient<DeliveryTimeSlotAdminDTO>("/Admin/shipping/time-slots", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateAdminTimeSlot(
  id: number,
  request: UpsertDeliveryTimeSlotRequest,
): Promise<DeliveryTimeSlotAdminDTO> {
  return apiClient<DeliveryTimeSlotAdminDTO>(`/Admin/shipping/time-slots/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteAdminTimeSlot(id: number): Promise<void> {
  await apiClient<void>(`/Admin/shipping/time-slots/${id}`, { method: "DELETE" });
}

export async function addAdminHoliday(request: CreateDeliveryHolidayRequest): Promise<DeliveryHolidayDTO> {
  return apiClient<DeliveryHolidayDTO>("/Admin/shipping/holidays", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function deleteAdminHoliday(id: number): Promise<void> {
  await apiClient<void>(`/Admin/shipping/holidays/${id}`, { method: "DELETE" });
}

export async function addAdminBlockedDate(
  request: CreateBlockedDeliveryDateRequest,
): Promise<BlockedDeliveryDateDTO> {
  return apiClient<BlockedDeliveryDateDTO>("/Admin/shipping/blocked-dates", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function deleteAdminBlockedDate(id: number): Promise<void> {
  await apiClient<void>(`/Admin/shipping/blocked-dates/${id}`, { method: "DELETE" });
}
