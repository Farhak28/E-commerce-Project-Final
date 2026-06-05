namespace ECommerce.Domain.Entities.AIModule;

public class VisualSearchEvent
{
    public long Id { get; set; }
    public Guid? SessionId { get; set; }
    public string? UserEmail { get; set; }
    public string DetectedCategory { get; set; } = "";
    public string? DetectedBrand { get; set; }
    public bool ExactMatchFound { get; set; }
    public int MatchCount { get; set; }
    public string AttributesJson { get; set; } = "{}";
    public int LatencyMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
