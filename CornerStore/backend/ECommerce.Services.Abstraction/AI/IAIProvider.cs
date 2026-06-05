namespace ECommerce.Services.Abstraction.AI;

public record AiChatMessage(string Role, string Content);

public record AiToolCall(string Name, string ArgumentsJson);

public record AiGenerateRequest(
    string SystemPrompt,
    IReadOnlyList<AiChatMessage> History,
    string UserMessage,
    IReadOnlyList<AiToolDefinition>? Tools = null
);

public record AiGenerateResponse(
    string? Text,
    IReadOnlyList<AiToolCall>? ToolCalls,
    int? PromptTokens,
    int? ResponseTokens
);

public record AiToolDefinition(string Name, string Description, string ParametersJsonSchema);

public interface IAIProvider
{
    string ProviderName { get; }
    bool IsConfigured { get; }
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default);
    Task<AiGenerateResponse> GenerateResponseAsync(AiGenerateRequest request, CancellationToken ct = default);
    Task<string> AnalyzeImageAsync(string imageBase64, string mimeType, string prompt, CancellationToken ct = default);
}
