using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;

namespace ECommerce.Services.Abstraction;

public interface IAdminAiService
{
    Task<Result<AdminAiOverviewDTO>> GetOverviewAsync(CancellationToken ct = default);

    Task<Result<AdminAiAnalyticsDTO>> GetAnalyticsAsync(CancellationToken ct = default);

    Task<Result<AdminAiLogsPageDTO>> GetLogsAsync(
        int page = 1,
        int pageSize = 20,
        string? search = null,
        CancellationToken ct = default
    );

    Task<Result<AssistantInteractionLogDetailDTO>> GetLogByIdAsync(long id, CancellationToken ct = default);

    Task<Result<KnowledgeStatsDTO>> GetKnowledgeStatsAsync(CancellationToken ct = default);

    Task<Result<SystemHealthDTO>> GetSystemHealthAsync(CancellationToken ct = default);

    Task<Result<AiConfigDTO>> GetAiConfigAsync(CancellationToken ct = default);

    Task<Result<AiCostSummaryDTO>> GetAiCostSummaryAsync(CancellationToken ct = default);

    Task<Result<RecommendationAnalyticsDTO>> GetRecommendationAnalyticsAsync(CancellationToken ct = default);

    Task<Result<VisualSearchAnalyticsDTO>> GetVisualSearchAnalyticsAsync(CancellationToken ct = default);
}
