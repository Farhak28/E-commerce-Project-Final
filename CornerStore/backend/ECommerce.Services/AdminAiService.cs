using System.Text.Json;
using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Services.AI;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ECommerce.Services;

public class AdminAiService : IAdminAiService
{
    private const double TokenCostPerThousandUsd = 0.00015;

    private readonly StoreDbContext _db;
    private readonly IChatAssistantService _assistant;
    private readonly AiOptions _aiOptions;

    public AdminAiService(
        StoreDbContext db,
        IChatAssistantService assistant,
        IOptions<AiOptions> aiOptions
    )
    {
        _db = db;
        _assistant = assistant;
        _aiOptions = aiOptions.Value;
    }

    public async Task<Result<AdminAiOverviewDTO>> GetOverviewAsync(CancellationToken ct = default)
    {
        var logs = await _db.AssistantInteractionLogs.AsNoTracking().ToListAsync(ct);
        var today = DateTime.UtcNow.Date;
        var toolCounts = CountToolUsage(logs);

        var docCount = await _db.KnowledgeDocuments.CountAsync(ct);
        var chunkCount = await _db.KnowledgeChunks.CountAsync(ct);
        var lastIndexed = await _db.KnowledgeChunks.AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => (DateTime?)c.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var status = await _assistant.GetStatusAsync();

        return Result<AdminAiOverviewDTO>.Ok(
            new AdminAiOverviewDTO(
                TotalConversations: logs.Count,
                ConversationsToday: logs.Count(l => l.CreatedAt.Date == today),
                UniqueSessions: logs.Where(l => l.SessionId.HasValue).Select(l => l.SessionId).Distinct().Count(),
                AverageLatencyMs: logs.Count > 0 ? logs.Average(l => l.LatencyMs) : 0,
                TotalKnowledgeDocuments: docCount,
                TotalKnowledgeChunks: chunkCount,
                LastIndexedAt: lastIndexed,
                ProductSearchRequests: toolCounts.GetValueOrDefault("searchProducts"),
                ComparisonRequests: toolCounts.GetValueOrDefault("compareProducts"),
                OrderStatusRequests: toolCounts.GetValueOrDefault("getOrderStatus"),
                RecommendationRequests: toolCounts.GetValueOrDefault("recommendProducts")
                    + toolCounts.GetValueOrDefault("getPersonalizedRecommendations"),
                GeminiConfigured: status.Configured,
                GeminiModel: status.Model,
                GeminiProvider: status.Provider
            )
        );
    }

    public async Task<Result<AdminAiAnalyticsDTO>> GetAnalyticsAsync(CancellationToken ct = default)
    {
        var logs = await _db.AssistantInteractionLogs.AsNoTracking().ToListAsync(ct);
        var since = DateTime.UtcNow.Date.AddDays(-13);

        var chatsByDay = logs
            .Where(l => l.CreatedAt >= since)
            .GroupBy(l => l.CreatedAt.Date.ToString("yyyy-MM-dd"))
            .Select(g => new DailyChatCountDTO(g.Key, g.Count()))
            .OrderBy(x => x.Date)
            .ToList();

        var toolUsage = CountToolUsage(logs)
            .Select(kv => new ToolUsageCountDTO(kv.Key, kv.Value))
            .OrderByDescending(x => x.Count)
            .ToList();

        var topPrompts = logs
            .GroupBy(l => l.UserPrompt.Trim().ToLowerInvariant())
            .Select(g => new TopPromptDTO(g.First().UserPrompt, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        return Result<AdminAiAnalyticsDTO>.Ok(
            new AdminAiAnalyticsDTO(chatsByDay, toolUsage, topPrompts)
        );
    }

    public async Task<Result<AdminAiLogsPageDTO>> GetLogsAsync(
        int page = 1,
        int pageSize = 20,
        string? search = null,
        CancellationToken ct = default
    )
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.AssistantInteractionLogs.AsNoTracking().OrderByDescending(l => l.CreatedAt).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(l =>
                l.UserPrompt.Contains(term)
                || l.AssistantResponse.Contains(term)
                || (l.UserEmail != null && l.UserEmail.Contains(term))
            );
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AssistantInteractionLogDTO(
                l.Id,
                l.SessionId,
                l.UserEmail,
                l.UserPrompt,
                l.AssistantResponse,
                l.ToolCalls,
                l.LatencyMs,
                l.PromptTokens,
                l.ResponseTokens,
                l.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<AdminAiLogsPageDTO>.Ok(new AdminAiLogsPageDTO(items, total, page, pageSize));
    }

    public async Task<Result<AssistantInteractionLogDetailDTO>> GetLogByIdAsync(long id, CancellationToken ct = default)
    {
        var log = await _db.AssistantInteractionLogs.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id, ct);
        if (log is null)
            return Error.NotFound("Log.NotFound", "Interaction log not found.");

        return Result<AssistantInteractionLogDetailDTO>.Ok(
            new AssistantInteractionLogDetailDTO(
                log.Id,
                log.SessionId,
                log.UserEmail,
                log.UserPrompt,
                log.AssistantResponse,
                log.ToolCalls,
                log.RetrievedChunks,
                log.LatencyMs,
                log.PromptTokens,
                log.ResponseTokens,
                log.CreatedAt
            )
        );
    }

    public async Task<Result<KnowledgeStatsDTO>> GetKnowledgeStatsAsync(CancellationToken ct = default)
    {
        var docCount = await _db.KnowledgeDocuments.CountAsync(ct);
        var chunkCount = await _db.KnowledgeChunks.CountAsync(ct);
        var lastUpdated = await _db.KnowledgeDocuments.AsNoTracking()
            .OrderByDescending(d => d.UpdatedAt)
            .Select(d => (DateTime?)d.UpdatedAt)
            .FirstOrDefaultAsync(ct);

        var byCategory = await _db.KnowledgeDocuments.AsNoTracking()
            .GroupBy(d => d.Category)
            .Select(g => new KnowledgeCategoryCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        return Result<KnowledgeStatsDTO>.Ok(
            new KnowledgeStatsDTO(docCount, chunkCount, lastUpdated, byCategory)
        );
    }

    public async Task<Result<SystemHealthDTO>> GetSystemHealthAsync(CancellationToken ct = default)
    {
        var dbHealthy = false;
        try
        {
            dbHealthy = await _db.Database.CanConnectAsync(ct);
        }
        catch
        {
            dbHealthy = false;
        }

        var chunkCount = await _db.KnowledgeChunks.CountAsync(ct);
        var embeddedCount = await _db.KnowledgeChunks.CountAsync(c => c.EmbeddingJson != "[]" && c.EmbeddingJson != "", ct);
        var status = await _assistant.GetStatusAsync();

        return Result<SystemHealthDTO>.Ok(
            new SystemHealthDTO(
                ApiHealthy: true,
                DatabaseHealthy: dbHealthy,
                GeminiConfigured: status.Configured,
                VectorStoreHealthy: chunkCount == 0 || embeddedCount > 0,
                VectorStoreType: $"InMemory ({embeddedCount}/{chunkCount} chunks embedded)",
                GeminiModel: status.Model,
                Message: status.Configured
                    ? "All core services operational."
                    : "Gemini API key not configured. Set GEMINI_API_KEY."
            )
        );
    }

    public Task<Result<AiConfigDTO>> GetAiConfigAsync(CancellationToken ct = default)
    {
        var configured = !string.IsNullOrWhiteSpace(_aiOptions.GeminiApiKey);
        return Task.FromResult(Result<AiConfigDTO>.Ok(
            new AiConfigDTO(
                Provider: "Google Gemini",
                ModelName: _aiOptions.ModelName,
                EmbeddingModelName: _aiOptions.EmbeddingModelName,
                Temperature: _aiOptions.Temperature,
                ChunkSize: _aiOptions.ChunkSize,
                TopKRetrieval: _aiOptions.TopKRetrieval,
                HistoryLength: _aiOptions.HistoryLength,
                MaxToolIterations: _aiOptions.MaxToolIterations,
                EnableStartupIndexing: _aiOptions.EnableStartupIndexing,
                GeminiConfigured: configured,
                SystemPromptSummary: "Corner Store shopping assistant with product search, recommendations, order tracking, and RAG knowledge retrieval."
            )
        ));
    }

    public async Task<Result<AiCostSummaryDTO>> GetAiCostSummaryAsync(CancellationToken ct = default)
    {
        var logs = await _db.AssistantInteractionLogs.AsNoTracking()
            .Where(l => l.PromptTokens != null || l.ResponseTokens != null)
            .ToListAsync(ct);

        var promptTokens = logs.Sum(l => l.PromptTokens ?? 0);
        var responseTokens = logs.Sum(l => l.ResponseTokens ?? 0);
        var totalTokens = promptTokens + responseTokens;
        var estimated = totalTokens / 1000.0 * TokenCostPerThousandUsd;

        return Result<AiCostSummaryDTO>.Ok(
            new AiCostSummaryDTO(promptTokens, responseTokens, estimated, logs.Count)
        );
    }

    public async Task<Result<RecommendationAnalyticsDTO>> GetRecommendationAnalyticsAsync(CancellationToken ct = default)
    {
        var events = await _db.RecommendationEvents.AsNoTracking().ToListAsync(ct);
        var impressions = events.Count(e => e.EventType == "impression");
        var clicks = events.Count(e => e.EventType == "click");
        var clickRate = impressions > 0 ? (double)clicks / impressions : 0;

        var aiLogs = await _db.AssistantInteractionLogs.AsNoTracking().ToListAsync(ct);
        var aiRecCount = CountToolUsage(aiLogs).GetValueOrDefault("recommendProducts")
            + CountToolUsage(aiLogs).GetValueOrDefault("getPersonalizedRecommendations");

        var productStats = new Dictionary<int, (int Impressions, int Clicks)>();
        foreach (var ev in events)
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<int>>(ev.ProductIdsJson) ?? [];
                foreach (var id in ids)
                {
                    if (!productStats.ContainsKey(id))
                        productStats[id] = (0, 0);
                    var current = productStats[id];
                    if (ev.EventType == "impression")
                        productStats[id] = (current.Impressions + 1, current.Clicks);
                    else if (ev.EventType == "click" && ev.ClickedProductId == id)
                        productStats[id] = (current.Impressions, current.Clicks + 1);
                }
            }
            catch
            {
                // ignore malformed json
            }
        }

        var products = await _db.Products.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Name, ct);

        var topRecommended = productStats
            .OrderByDescending(kv => kv.Value.Impressions)
            .Take(10)
            .Select(kv => new ProductRecommendationStatDTO(
                kv.Key,
                products.GetValueOrDefault(kv.Key, $"Product #{kv.Key}"),
                kv.Value.Impressions,
                kv.Value.Clicks,
                kv.Value.Impressions > 0 ? (double)kv.Value.Clicks / kv.Value.Impressions : 0
            ))
            .ToList();

        var trending = productStats
            .OrderByDescending(kv => kv.Value.Impressions + kv.Value.Clicks * 2)
            .Take(8)
            .Select(kv => new ProductRecommendationStatDTO(
                kv.Key,
                products.GetValueOrDefault(kv.Key, $"Product #{kv.Key}"),
                kv.Value.Impressions,
                kv.Value.Clicks,
                kv.Value.Impressions > 0 ? (double)kv.Value.Clicks / kv.Value.Impressions : 0
            ))
            .ToList();

        return Result<RecommendationAnalyticsDTO>.Ok(
            new RecommendationAnalyticsDTO(impressions, clicks, clickRate, aiRecCount, topRecommended, trending)
        );
    }

    private static Dictionary<string, int> CountToolUsage(IEnumerable<AssistantInteractionLog> logs)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var log in logs)
        {
            if (string.IsNullOrWhiteSpace(log.ToolCalls))
                continue;

            try
            {
                using var doc = JsonDocument.Parse(log.ToolCalls);
                if (doc.RootElement.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    if (el.TryGetProperty("Name", out var nameProp))
                    {
                        var name = nameProp.GetString();
                        if (!string.IsNullOrWhiteSpace(name))
                            counts[name] = counts.GetValueOrDefault(name) + 1;
                    }
                }
            }
            catch
            {
                // ignore malformed tool logs
            }
        }

        return counts;
    }

    public async Task<Result<VisualSearchAnalyticsDTO>> GetVisualSearchAnalyticsAsync(CancellationToken ct = default)
    {
        var events = await _db.VisualSearchEvents.AsNoTracking().ToListAsync(ct);
        var today = DateTime.UtcNow.Date;
        var since = today.AddDays(-13);

        var searchesByDay = events
            .Where(e => e.CreatedAt.Date >= since)
            .GroupBy(e => e.CreatedAt.Date.ToString("yyyy-MM-dd"))
            .Select(g => new DailyChatCountDTO(g.Key, g.Count()))
            .OrderBy(x => x.Date)
            .ToList();

        var topCategories = events
            .GroupBy(e => e.DetectedCategory)
            .Select(g => new KnowledgeCategoryCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        var topBrands = events
            .Where(e => !string.IsNullOrWhiteSpace(e.DetectedBrand))
            .GroupBy(e => e.DetectedBrand!)
            .Select(g => new KnowledgeCategoryCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        var matchSuccessRate = events.Count == 0
            ? 0
            : events.Count(e => e.ExactMatchFound || e.MatchCount > 0) * 100.0 / events.Count;

        return Result<VisualSearchAnalyticsDTO>.Ok(
            new VisualSearchAnalyticsDTO(
                events.Count,
                events.Count(e => e.CreatedAt.Date == today),
                Math.Round(matchSuccessRate, 1),
                searchesByDay,
                topCategories,
                topBrands
            )
        );
    }
}
