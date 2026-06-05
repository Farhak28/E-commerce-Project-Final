namespace ECommerce.Shared.DTOs.AdminDTOs;

public record AdminAiOverviewDTO(
    int TotalConversations,
    int ConversationsToday,
    int UniqueSessions,
    double AverageLatencyMs,
    int TotalKnowledgeDocuments,
    int TotalKnowledgeChunks,
    DateTime? LastIndexedAt,
    int ProductSearchRequests,
    int ComparisonRequests,
    int OrderStatusRequests,
    int RecommendationRequests,
    bool GeminiConfigured,
    string? GeminiModel,
    string? GeminiProvider
);

public record AssistantInteractionLogDTO(
    long Id,
    Guid? SessionId,
    string? UserEmail,
    string UserPrompt,
    string AssistantResponse,
    string? ToolCalls,
    int LatencyMs,
    int? PromptTokens,
    int? ResponseTokens,
    DateTime CreatedAt
);

public record AdminAiLogsPageDTO(
    IReadOnlyList<AssistantInteractionLogDTO> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record KnowledgeStatsDTO(
    int DocumentCount,
    int ChunkCount,
    DateTime? LastUpdatedAt,
    IReadOnlyList<KnowledgeCategoryCountDTO> ByCategory
);

public record KnowledgeCategoryCountDTO(string Category, int Count);

public record SystemHealthDTO(
    bool ApiHealthy,
    bool DatabaseHealthy,
    bool GeminiConfigured,
    bool VectorStoreHealthy,
    string VectorStoreType,
    string? GeminiModel,
    string? Message
);

public record DailyChatCountDTO(string Date, int Count);

public record AdminAiAnalyticsDTO(
    IReadOnlyList<DailyChatCountDTO> ChatsByDay,
    IReadOnlyList<ToolUsageCountDTO> ToolUsage,
    IReadOnlyList<TopPromptDTO> TopPrompts
);

public record ToolUsageCountDTO(string ToolName, int Count);

public record TopPromptDTO(string Prompt, int Count);
