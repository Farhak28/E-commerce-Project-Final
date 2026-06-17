namespace ECommerce.Domain.Entities.OrderModule;

/// <summary>Singleton scheduling configuration (Id = 1).</summary>
public class DeliverySchedulingSettings : BaseEntity<int>
{
    public int MinLeadHours { get; set; }

    public int MaxScheduleDaysAhead { get; set; }

    public bool SchedulingEnabled { get; set; } = true;
}
