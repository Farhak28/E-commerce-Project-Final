using ECommerce.Services.Abstraction.AI;

namespace ECommerce.Services.AI;

public sealed record GeminiContentPart(
    string Role,
    string Text,
    IReadOnlyList<AiToolCall>? ToolCalls = null,
    string? FunctionName = null,
    object? FunctionResponse = null
);
