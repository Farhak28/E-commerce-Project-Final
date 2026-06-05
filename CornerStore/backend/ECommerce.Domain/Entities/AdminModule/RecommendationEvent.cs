namespace ECommerce.Domain.Entities.AdminModule;

public class RecommendationEvent : BaseEntity<long>
{
    public string Source { get; set; } = default!;
    public string EventType { get; set; } = "impression";
    public string ProductIdsJson { get; set; } = "[]";
    public int? ClickedProductId { get; set; }
    public string? UserEmail { get; set; }
    public DateTime CreatedAt { get; set; }
}
