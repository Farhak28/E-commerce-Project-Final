import { apiClient } from "@/lib/services/api-client";
import type { DeliveryMethodDTO, OrderDTO, OrderToReturnDTO } from "@/lib/types";

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
