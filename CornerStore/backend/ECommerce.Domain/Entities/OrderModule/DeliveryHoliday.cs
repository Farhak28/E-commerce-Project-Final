namespace ECommerce.Domain.Entities.OrderModule;

public class DeliveryHoliday : BaseEntity<int>
{
    public DateOnly Date { get; set; }

    public string Name { get; set; } = default!;
}
