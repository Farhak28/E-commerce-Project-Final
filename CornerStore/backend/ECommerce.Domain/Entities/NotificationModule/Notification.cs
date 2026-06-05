using ECommerce.Domain.Entities;

namespace ECommerce.Domain.Entities.NotificationModule;

public class Notification : BaseEntity<int>
{
    public string UserEmail { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;
    public bool IsRead { get; set; }
    public string Category { get; set; } = "general";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
