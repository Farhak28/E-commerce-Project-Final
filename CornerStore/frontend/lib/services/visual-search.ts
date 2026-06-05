import { apiClient } from "@/lib/services/api-client";
import { getAssistantSessionId } from "@/lib/utils/assistant-storage";
import type { VisualSearchResponse } from "@/lib/types/visual-search";

export async function searchByImage(imageBase64: string, mimeType: string) {
  return apiClient<VisualSearchResponse>("/Assistant/visual-search", {
    method: "POST",
    body: JSON.stringify({
      imageBase64,
      mimeType,
      sessionId: getAssistantSessionId(),
    }),
  });
}
