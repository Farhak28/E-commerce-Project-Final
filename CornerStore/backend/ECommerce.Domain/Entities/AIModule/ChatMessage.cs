namespace ECommerce.Domain.Entities.AIModule;

public class ChatMessage
{
    public long Id { get; set; }
    public Guid SessionId { get; set; }
    public ChatSession Session { get; set; } = default!;
    public string Role { get; set; } = "user";
    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
