namespace ECommerce.Domain.Entities.AIModule;

public class AssistantInteractionLog
{
    public long Id { get; set; }
    public Guid? SessionId { get; set; }
    public string? UserEmail { get; set; }
    public string UserPrompt { get; set; } = default!;
    public string? RetrievedChunks { get; set; }
    public string? ToolCalls { get; set; }
    public string? ToolResponses { get; set; }
    public string AssistantResponse { get; set; } = default!;
    public int LatencyMs { get; set; }
    public int? PromptTokens { get; set; }
    public int? ResponseTokens { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
