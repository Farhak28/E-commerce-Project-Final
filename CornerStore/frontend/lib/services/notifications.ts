import { apiClient } from "@/lib/services/api-client";
import type { NotificationDTO } from "@/lib/types";

export async function getNotifications(): Promise<NotificationDTO[]> {
  return apiClient<NotificationDTO[]>("/Notifications");
}

export async function getUnreadNotificationCount(): Promise<number> {
  return apiClient<number>("/Notifications/unread-count");
}

export async function markNotificationRead(id: number): Promise<void> {
  return apiClient<void>(`/Notifications/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiClient<void>("/Notifications/read-all", { method: "PUT" });
}
