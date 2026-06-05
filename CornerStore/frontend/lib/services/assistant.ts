import { apiClient } from "@/lib/services/api-client";
import type {
  AssistantChatRequestDTO,
  AssistantChatResponseDTO,
  AssistantSessionHistoryDTO,
  AssistantStatusDTO,
} from "@/lib/types/assistant";

export async function getAssistantStatus() {
  return apiClient<AssistantStatusDTO>("/Assistant/status", { skipAuth: true });
}

export async function sendAssistantChat(request: AssistantChatRequestDTO) {
  return apiClient<AssistantChatResponseDTO>("/Assistant/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getAssistantSessionHistory(sessionId: string) {
  return apiClient<AssistantSessionHistoryDTO>(`/Assistant/sessions/${sessionId}/messages`, {
    skipAuth: true,
  });
}
