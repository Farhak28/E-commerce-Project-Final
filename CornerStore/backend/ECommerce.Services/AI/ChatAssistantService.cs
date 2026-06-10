using System.Diagnostics;
using System.Text.Json;
using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public sealed class ChatAssistantService : IChatAssistantService
{
    private static bool IsValidGeminiApiKey(string key) =>
        !string.IsNullOrWhiteSpace(key)
        && (key.StartsWith("AIza", StringComparison.Ordinal) || key.StartsWith("AQ.", StringComparison.Ordinal));

    private readonly StoreDbContext _db;
    private readonly IAIProvider _ai;
    private readonly IRagService _rag;
    private readonly IAssistantToolExecutor _tools;
    private readonly IProductService _products;
    private readonly GeminiProvider _gemini;
    private readonly AiOptions _options;
    private readonly ILogger<ChatAssistantService> _logger;

    public ChatAssistantService(
        StoreDbContext db,
        IAIProvider ai,
        IRagService rag,
        IAssistantToolExecutor tools,
        IProductService products,
        IOptions<AiOptions> options,
        ILogger<ChatAssistantService> logger
    )
    {
        _db = db;
        _ai = ai;
        _rag = rag;
        _tools = tools;
        _products = products;
        _options = options.Value;
        _logger = logger;
        _gemini = ai as GeminiProvider ?? throw new InvalidOperationException("GeminiProvider required.");
    }

    public Task<AssistantStatusDTO> GetStatusAsync()
    {
        var key = _options.GeminiApiKey?.Trim() ?? "";
        var validKey = IsValidGeminiApiKey(key);
        return Task.FromResult(new AssistantStatusDTO(validKey, _ai.ProviderName, _options.ModelName));
    }

    public async Task<AssistantSessionHistoryDTO?> GetSessionHistoryAsync(
        Guid sessionId,
        CancellationToken ct = default
    )
    {
        var session = await _db.ChatSessions
            .AsNoTracking()
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct);

        if (session is null)
            return null;

        var messages = session.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new AssistantChatMessageDTO(m.Role, m.Content))
            .ToList();

        return new AssistantSessionHistoryDTO(sessionId, messages);
    }

    public async Task<AssistantChatResponseDTO> ChatAsync(
        AssistantChatRequestDTO request,
        string? userEmail,
        CancellationToken ct = default
    )
    {
        if (!_ai.IsConfigured)
        {
            return new AssistantChatResponseDTO(
                request.SessionId ?? Guid.NewGuid(),
                "AI assistant is not configured. Set GEMINI_API_KEY on the API server.",
                null,
                false,
                null
            );
        }

        var apiKey = _options.GeminiApiKey.Trim();
        if (!IsValidGeminiApiKey(apiKey))
        {
            return new AssistantChatResponseDTO(
                request.SessionId ?? Guid.NewGuid(),
                "Invalid GEMINI_API_KEY. Create an API key at Google AI Studio (https://aistudio.google.com/apikey).",
                null,
                false,
                null
            );
        }

        var sw = Stopwatch.StartNew();
        var sessionId = request.SessionId ?? Guid.NewGuid();
        var context = request.Context ?? new AssistantContextDTO();
        var message = request.Message.Trim();
        if (string.IsNullOrWhiteSpace(message))
            return new AssistantChatResponseDTO(sessionId, "Please send a message.", null, true, _ai.ProviderName);

        var session = await _db.ChatSessions.Include(s => s.Messages).FirstOrDefaultAsync(s => s.Id == sessionId, ct);
        if (session is null)
        {
            session = new ChatSession { Id = sessionId, UserEmail = userEmail };
            _db.ChatSessions.Add(session);
        }
        else
        {
            session.UserEmail ??= userEmail;
            session.UpdatedAt = DateTime.UtcNow;
        }

        var ragHits = await _rag.RetrieveAsync(message, _options.TopKRetrieval, ct);
        var categories = (await _products.GetAllTypesAsync())
            .Select(t => t.Name)
            .ToList();
        var systemPrompt = BuildSystemPrompt(ragHits, context, categories);

        var history = BuildHistory(session, request.History);
        var geminiContents = history
            .Select(m => new GeminiContentPart(m.Role == "assistant" ? "model" : "user", m.Content))
            .ToList();
        geminiContents.Add(new GeminiContentPart("user", message));

        var toolLog = new List<object>();
        var toolResponseLog = new List<object>();
        List<ProductDTO>? lastProducts = null;
        AssistantStructuredDataDTO? structured = null;
        string? finalText = null;
        int? promptTokens = null;
        int? responseTokens = null;

        try
        {
            for (var iteration = 0; iteration < _options.MaxToolIterations; iteration++)
            {
                var gen = await _gemini.GenerateWithContentsAsync(
                    systemPrompt,
                    geminiContents,
                    AssistantToolCatalog.All,
                    ct
                );
                promptTokens = (promptTokens ?? 0) + (gen.PromptTokens ?? 0);
                responseTokens = (responseTokens ?? 0) + (gen.ResponseTokens ?? 0);

                if (gen.ToolCalls is null || gen.ToolCalls.Count == 0)
                {
                    finalText = gen.Text ?? "How can I help you shop today?";
                    break;
                }

                geminiContents.Add(new GeminiContentPart("model", gen.Text ?? "", gen.ToolCalls));

                foreach (var call in gen.ToolCalls)
                {
                    toolLog.Add(new { call.Name, call.ArgumentsJson });
                    var resultJson = await _tools.ExecuteAsync(call.Name, call.ArgumentsJson, userEmail, context, ct);
                    toolResponseLog.Add(new { call.Name, resultJson });
                    lastProducts = ExtractProducts(resultJson) ?? lastProducts;
                    structured = MergeStructured(structured, call.Name, resultJson);

                    geminiContents.Add(new GeminiContentPart("function", "", null, call.Name, ParseJsonObject(resultJson)));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini assistant failed for session {SessionId}", sessionId);
            var hint = ex.Message.Contains("rate limit", StringComparison.OrdinalIgnoreCase)
                || ex.Message.Contains("TooManyRequests", StringComparison.OrdinalIgnoreCase)
                || ex.Message.Contains("429", StringComparison.OrdinalIgnoreCase)
                || ex.Message.Contains("quota", StringComparison.OrdinalIgnoreCase)
                ? ex.Message.Contains("Gemini")
                    ? ex.Message
                    : $"Gemini free-tier limit hit for model '{_options.ModelName}'. Wait 1–2 minutes and try again."
                : ex.Message.Contains("model not found", StringComparison.OrdinalIgnoreCase)
                    || ex.Message.Contains("NOT_FOUND", StringComparison.OrdinalIgnoreCase)
                  ? ex.Message
                  : ex.Message.StartsWith("Gemini API error", StringComparison.OrdinalIgnoreCase)
                    ? ex.Message
                    : "The AI service returned an error. Verify GEMINI_API_KEY at https://aistudio.google.com/api-keys and try again.";
            return UnavailableResponse(sessionId, hint);
        }

        finalText ??= "I reached the tool limit. Please try a simpler question.";

        await PersistMessages(session, message, finalText, ct);

        sw.Stop();
        _db.AssistantInteractionLogs.Add(
            new AssistantInteractionLog
            {
                SessionId = sessionId,
                UserEmail = userEmail,
                UserPrompt = message,
                RetrievedChunks = JsonSerializer.Serialize(ragHits.Select(c => new { c.Title, c.Score, c.Text })),
                ToolCalls = JsonSerializer.Serialize(toolLog),
                ToolResponses = JsonSerializer.Serialize(toolResponseLog),
                AssistantResponse = finalText,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                PromptTokens = promptTokens,
                ResponseTokens = responseTokens,
            }
        );
        await _db.SaveChangesAsync(ct);

        return new AssistantChatResponseDTO(sessionId, finalText, lastProducts, true, _ai.ProviderName, structured);
    }

    private AssistantChatResponseDTO UnavailableResponse(Guid sessionId, string reason) =>
        new(
            sessionId,
            reason,
            null,
            true,
            _ai.ProviderName
        );

    private static string BuildSystemPrompt(
        IReadOnlyList<RagChunkHit> rag,
        AssistantContextDTO ctx,
        IReadOnlyList<string> categories
    )
    {
        var ragBlock = rag.Count == 0
            ? "No retrieved documents."
            : string.Join(
                "\n\n",
                rag.Select(c => $"[{c.Category}] {c.Title}\n{c.Text}")
            );

        var categoryBlock = categories.Count == 0
            ? "No categories loaded."
            : string.Join(", ", categories);

        var ctxBlock = $"""
            Cart product IDs: {string.Join(", ", ctx.CartProductIds ?? Array.Empty<int>())}
            Recently viewed IDs: {string.Join(", ", ctx.RecentProductIds ?? Array.Empty<int>())}
            Compare list IDs: {string.Join(", ", ctx.CompareIds ?? Array.Empty<int>())}
            Basket ID: {(string.IsNullOrWhiteSpace(ctx.BasketId) ? "unavailable" : ctx.BasketId)}
            """;

        return $"""
            You are Corner Store AI Shopping Assistant.
            Rules:
            - Never invent products, prices, stock, or order status.
            - Always use tools for product facts, recommendations, comparisons, orders, and policies.
            - Use retrieved knowledge for FAQ/policy answers when relevant.
            - Catalog prices are USD. If user mentions EGP, treat the number as a numeric budget cap only.
            - Product categories in this store: {categoryBlock}. Use exact category names with recommendProducts.
            - Be concise, friendly, and helpful for shopping.
            - When comparing products, summarize differences clearly with pros, cons, and a recommended choice.
            - Use getReviewSummary for review sentiment questions — never invent review opinions.
            - When the user asks to add something to cart or wishlist, use searchProducts or prior context to resolve productId, then call addToCart or addToWishlist.
            - addToWishlist requires the user to be signed in; addToCart uses the Basket ID from context.
            - If information is unavailable, say so.

            Retrieved knowledge:
            {ragBlock}

            User context:
            {ctxBlock}
            """;
    }

    private static List<AiChatMessage> BuildHistory(ChatSession session, IReadOnlyList<AssistantChatMessageDTO>? clientHistory)
    {
        if (clientHistory?.Count > 0)
        {
            return clientHistory
                .Where(m => m.Role is "user" or "assistant")
                .Select(m => new AiChatMessage(m.Role, m.Content))
                .ToList();
        }

        return session.Messages
            .OrderBy(m => m.CreatedAt)
            .TakeLast(20)
            .Select(m => new AiChatMessage(m.Role, m.Content))
            .ToList();
    }

    private async Task PersistMessages(ChatSession session, string userMsg, string assistantMsg, CancellationToken ct)
    {
        session.Messages.Add(new ChatMessage { Role = "user", Content = userMsg, SessionId = session.Id });
        session.Messages.Add(new ChatMessage { Role = "assistant", Content = assistantMsg, SessionId = session.Id });
        session.UpdatedAt = DateTime.UtcNow;

        var overflow = session.Messages.Count - _options.HistoryLength * 2;
        if (overflow > 0)
        {
            var toRemove = session.Messages.OrderBy(m => m.CreatedAt).Take(overflow).ToList();
            _db.ChatMessages.RemoveRange(toRemove);
        }

        await _db.SaveChangesAsync(ct);
    }

    private static List<ProductDTO>? ExtractProducts(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("products", out var arr)) return null;
            return JsonSerializer.Deserialize<List<ProductDTO>>(arr.GetRawText());
        }
        catch
        {
            return null;
        }
    }

    private static object ParseJsonObject(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(json) ?? new { };
        }
        catch
        {
            return new { raw = json };
        }
    }

    private static AssistantStructuredDataDTO? MergeStructured(
        AssistantStructuredDataDTO? current,
        string toolName,
        string resultJson
    )
    {
        try
        {
            using var doc = JsonDocument.Parse(resultJson);
            var root = doc.RootElement;

            return toolName switch
            {
                "compareProducts" when root.TryGetProperty("products", out var productsEl)
                    => (current ?? new AssistantStructuredDataDTO()) with
                    {
                        Comparison = new ComparisonCardDTO(
                            productsEl.Deserialize<List<ComparisonProductDTO>>() ?? [],
                            null
                        ),
                    },
                "getOrderStatus" when root.TryGetProperty("order", out var orderEl)
                    => (current ?? new AssistantStructuredDataDTO()) with
                    {
                        Orders = new OrderStatusCardDTO(
                            [],
                            orderEl.Deserialize<OrderStatusItemDTO>()
                        ),
                    },
                "getOrderStatus" when root.TryGetProperty("orders", out var ordersEl)
                    => (current ?? new AssistantStructuredDataDTO()) with
                    {
                        Orders = new OrderStatusCardDTO(
                            ordersEl.Deserialize<List<OrderStatusItemDTO>>() ?? [],
                            null
                        ),
                    },
                "getReviewSummary" when root.TryGetProperty("reviewSummary", out var summaryEl)
                    => (current ?? new AssistantStructuredDataDTO()) with
                    {
                        ReviewSummary = summaryEl.Deserialize<ReviewSummaryDTO>(),
                    },
                _ => current,
            };
        }
        catch
        {
            return current;
        }
    }
}
