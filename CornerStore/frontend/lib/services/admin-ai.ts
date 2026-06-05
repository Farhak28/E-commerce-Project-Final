import { apiClient } from "@/lib/services/api-client";
import type {
  AdminAiAnalyticsDTO,
  AdminAiLogsPageDTO,
  AdminAiOverviewDTO,
  AiConfigDTO,
  AiCostSummaryDTO,
  AssistantInteractionLogDetailDTO,
  KnowledgeStatsDTO,
  RecommendationAnalyticsDTO,
  SystemHealthDTO,
} from "@/lib/types";
import type { VisualSearchAnalytics } from "@/lib/types/visual-search";

export async function getAdminAiOverview(): Promise<AdminAiOverviewDTO> {
  return apiClient<AdminAiOverviewDTO>("/Admin/ai/overview");
}

export async function getAdminAiAnalytics(): Promise<AdminAiAnalyticsDTO> {
  return apiClient<AdminAiAnalyticsDTO>("/Admin/ai/analytics");
}

export async function getAdminAiLogs(
  page = 1,
  pageSize = 20,
  search?: string,
): Promise<AdminAiLogsPageDTO> {
  return apiClient<AdminAiLogsPageDTO>("/Admin/ai/logs", {
    params: { page, pageSize, search },
  });
}

export async function getAdminAiLogById(id: number): Promise<AssistantInteractionLogDetailDTO> {
  return apiClient<AssistantInteractionLogDetailDTO>(`/Admin/ai/logs/${id}`);
}

export async function getAdminKnowledgeStats(): Promise<KnowledgeStatsDTO> {
  return apiClient<KnowledgeStatsDTO>("/Admin/ai/knowledge/stats");
}

export async function getAdminSystemHealth(): Promise<SystemHealthDTO> {
  return apiClient<SystemHealthDTO>("/Admin/system/health");
}

export async function getAdminAiConfig(): Promise<AiConfigDTO> {
  return apiClient<AiConfigDTO>("/Admin/ai/config");
}

export async function getAdminAiCost(): Promise<AiCostSummaryDTO> {
  return apiClient<AiCostSummaryDTO>("/Admin/ai/cost");
}

export async function getAdminRecommendationAnalytics(): Promise<RecommendationAnalyticsDTO> {
  return apiClient<RecommendationAnalyticsDTO>("/Admin/ai/recommendations");
}

export async function getAdminVisualSearchAnalytics(): Promise<VisualSearchAnalytics> {
  return apiClient<VisualSearchAnalytics>("/Admin/ai/visual-search");
}
