namespace ECommerce.Shared.DTOs.AdminDTOs;

public record AdminPagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public class AdminListQueryParams
{
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdminOrderQueryParams : AdminListQueryParams
{
    public string? UserEmail { get; set; }
    public string? Status { get; set; }
}

public record AdminReviewDTO(
    int Id,
    int ProductId,
    string ProductName,
    string UserName,
    int Rating,
    string Comment,
    DateTime CreatedAt
);

public record KnowledgeChunkDTO(
    int Id,
    int DocumentId,
    string DocumentTitle,
    int ChunkIndex,
    string TextPreview,
    bool HasEmbedding,
    DateTime CreatedAt
);

public record KnowledgeChunksPageDTO(
    IReadOnlyList<KnowledgeChunkDTO> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record AuditLogDTO(
    long Id,
    string ActorEmail,
    string Action,
    string EntityType,
    string? EntityId,
    string? Details,
    DateTime CreatedAt
);

public record AuditLogsPageDTO(
    IReadOnlyList<AuditLogDTO> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record AssistantInteractionLogDetailDTO(
    long Id,
    Guid? SessionId,
    string? UserEmail,
    string UserPrompt,
    string AssistantResponse,
    string? ToolCalls,
    string? RetrievedChunks,
    int LatencyMs,
    int? PromptTokens,
    int? ResponseTokens,
    DateTime CreatedAt
);

public record AiConfigDTO(
    string Provider,
    string ModelName,
    string EmbeddingModelName,
    float Temperature,
    int ChunkSize,
    int TopKRetrieval,
    int HistoryLength,
    int MaxToolIterations,
    bool EnableStartupIndexing,
    bool GeminiConfigured,
    string? SystemPromptSummary
);

public record AiCostSummaryDTO(
    long TotalPromptTokens,
    long TotalResponseTokens,
    double EstimatedCostUsd,
    int ConversationsWithTokens
);

public record ProductRecommendationStatDTO(
    int ProductId,
    string ProductName,
    int ImpressionCount,
    int ClickCount,
    double ClickRate
);

public record RecommendationAnalyticsDTO(
    int TotalImpressions,
    int TotalClicks,
    double OverallClickRate,
    int AiRecommendationRequests,
    IReadOnlyList<ProductRecommendationStatDTO> TopRecommended,
    IReadOnlyList<ProductRecommendationStatDTO> TrendingProducts
);

public record AdminReportsDTO(
    IReadOnlyList<RevenueByMonthDTO> RevenueByMonth,
    IReadOnlyList<OrdersByStatusDTO> OrdersByStatus,
    int LowStockProducts,
    int TotalReviews,
    double AverageRating
);

public record AdminStatsDTO(
    int UsersCount,
    int OrdersCount,
    decimal Revenue,
    int ProductsCount,
    int PendingOrdersCount,
    int LowStockCount,
    int ActiveShipmentsCount,
    int DeliveredOrdersCount,
    int ScheduledDeliveriesCount,
    int ActiveCouponsCount,
    int RedeemedCouponsCount,
    decimal TotalDiscountsGiven,
    int ReviewsCount,
    int BrandsWithOfficialUrlCount
);

public record AdminCouponsSummaryDTO(
    int ActiveCoupons,
    int RedeemedCoupons,
    int ExpiredCoupons,
    decimal TotalDiscountsGiven,
    IReadOnlyList<AdminCouponTierDTO> CouponsByReward
);

public record AdminCouponTierDTO(string RewardKey, int Active, int Redeemed);
