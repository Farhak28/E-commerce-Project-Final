namespace ECommerce.Domain.Entities.AIModule;

public class ChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
