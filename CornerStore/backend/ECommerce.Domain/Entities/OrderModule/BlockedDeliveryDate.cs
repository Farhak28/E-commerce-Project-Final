namespace ECommerce.Domain.Entities.OrderModule;

public class BlockedDeliveryDate : BaseEntity<int>
{
    public DateOnly Date { get; set; }

    public string? Reason { get; set; }
}
