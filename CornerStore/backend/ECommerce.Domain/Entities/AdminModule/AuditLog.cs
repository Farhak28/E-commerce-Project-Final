namespace ECommerce.Domain.Entities.AdminModule;

public class AuditLog : BaseEntity<long>
{
    public string ActorEmail { get; set; } = default!;
    public string Action { get; set; } = default!;
    public string EntityType { get; set; } = default!;
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}
