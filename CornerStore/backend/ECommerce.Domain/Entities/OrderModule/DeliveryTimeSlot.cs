namespace ECommerce.Domain.Entities.OrderModule;

public class DeliveryTimeSlot : BaseEntity<int>
{
    public string Label { get; set; } = default!;

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public int Capacity { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}
