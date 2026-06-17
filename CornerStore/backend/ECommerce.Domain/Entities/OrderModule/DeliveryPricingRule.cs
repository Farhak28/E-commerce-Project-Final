namespace ECommerce.Domain.Entities.OrderModule;

public class DeliveryPricingRule : BaseEntity<int>
{
    public DeliveryPricingRuleType RuleType { get; set; }

    public string Label { get; set; } = default!;

    /// <summary>Fixed surcharge/discount amount (negative for discounts).</summary>
    public decimal Amount { get; set; }

    /// <summary>Minimum lead time in hours from now (inclusive).</summary>
    public int? MinLeadHours { get; set; }

    /// <summary>Maximum lead time in hours from now (inclusive).</summary>
    public int? MaxLeadHours { get; set; }

    /// <summary>Minimum lead time in days for economy-style rules.</summary>
    public int? MinLeadDays { get; set; }

    /// <summary>Hour of day start (0-23) for time-window rules.</summary>
    public int? WindowStartHour { get; set; }

    /// <summary>Hour of day end (0-23) for time-window rules.</summary>
    public int? WindowEndHour { get; set; }

    /// <summary>When set, rule applies only on this day of week.</summary>
    public DayOfWeek? DayOfWeek { get; set; }

    /// <summary>For percentage caps on discounts (0-1).</summary>
    public decimal? PercentOfBaseCap { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}
