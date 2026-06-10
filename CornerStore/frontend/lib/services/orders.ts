import { apiClient } from "@/lib/services/api-client";
import type {
  DeliveryMethodDTO,
  DeliveryQuoteDTO,
  OrderDTO,
  OrderToReturnDTO,
  OrderTrackingDTO,
} from "@/lib/types";

export async function getOrders(): Promise<OrderToReturnDTO[]> {
  return apiClient<OrderToReturnDTO[]>("/Orders");
}

export async function getOrderById(id: string): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>(`/Orders/${id}`);
}

export async function createOrder(order: OrderDTO): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>("/Orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getDeliveryMethods(): Promise<DeliveryMethodDTO[]> {
  return apiClient<DeliveryMethodDTO[]>("/Orders/deliveryMethods", {
    skipAuth: true,
  });
}

export async function getDeliveryQuote(
  deliveryMethodId: number,
  scheduledDeliveryAt?: string | null,
): Promise<DeliveryQuoteDTO> {
  return apiClient<DeliveryQuoteDTO>("/Orders/deliveryQuote", {
    skipAuth: true,
    params: {
      deliveryMethodId,
      ...(scheduledDeliveryAt ? { scheduledDeliveryAt } : {}),
    },
  });
}

export async function cancelOrder(id: string): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>(`/Orders/${id}/cancel`, { method: "POST" });
}

export async function requestReturn(id: string, reason: string): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>(`/Orders/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function scheduleOrder(id: string, scheduledDeliveryAt: string): Promise<OrderToReturnDTO> {
  return apiClient<OrderToReturnDTO>(`/Orders/${id}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduledDeliveryAt }),
  });
}

export async function getOrderTracking(id: string): Promise<OrderTrackingDTO> {
  return apiClient<OrderTrackingDTO>(`/Orders/${id}/tracking`);
}

export async function advanceOrderTracking(id: string): Promise<OrderTrackingDTO> {
  return apiClient<OrderTrackingDTO>(`/Orders/${id}/tracking/advance`, { method: "POST" });
}
