namespace ECommerce.Domain.Entities.OrderModule;

public class OrderTrackingEvent
{
    public long Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public FulfillmentStage Stage { get; set; }
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string? Location { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}
