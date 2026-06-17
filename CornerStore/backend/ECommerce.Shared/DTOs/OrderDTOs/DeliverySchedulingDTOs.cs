namespace ECommerce.Shared.DTOs.OrderDTOs;

public record DeliverySchedulingSettingsDTO
{
    public int MinLeadHours { get; init; }
    public int MaxScheduleDaysAhead { get; init; }
    public bool SchedulingEnabled { get; init; }
}

public record AvailableDeliveryDateDTO
{
    public required string Date { get; init; }
    public bool IsAvailable { get; init; }
    public string? Reason { get; init; }
}

public record DeliveryTimeSlotDTO
{
    public int Id { get; init; }
    public required string Label { get; init; }
    public required string StartTime { get; init; }
    public required string EndTime { get; init; }
    public int Capacity { get; init; }
    public int RemainingCapacity { get; init; }
    public bool IsAvailable { get; init; }
}

public record DeliveryPricingRuleDTO
{
    public int Id { get; init; }
    public required string RuleType { get; init; }
    public required string Label { get; init; }
    public decimal Amount { get; init; }
    public bool IsActive { get; init; }
}

public record DeliveryOptionsDTO
{
    public required IEnumerable<DeliveryMethodDTO> DeliveryMethods { get; init; }
    public DeliverySchedulingSettingsDTO Settings { get; init; } = default!;
    public bool SchedulingEnabled { get; init; }
}

public record DeliveryQuoteRequestDTO
{
    public int DeliveryMethodId { get; init; }
    public string DeliveryType { get; init; } = "Standard";
    public DateTimeOffset? ScheduledDeliveryAt { get; init; }
    public int? DeliveryTimeSlotId { get; init; }
    public string? ScheduledDate { get; init; }
}

public record DeliveryHolidayDTO
{
    public int Id { get; init; }
    public required string Date { get; init; }
    public required string Name { get; init; }
}

public record BlockedDeliveryDateDTO
{
    public int Id { get; init; }
    public required string Date { get; init; }
    public string? Reason { get; init; }
}

public record DeliveryTimeSlotAdminDTO
{
    public int Id { get; init; }
    public required string Label { get; init; }
    public required string StartTime { get; init; }
    public required string EndTime { get; init; }
    public int Capacity { get; init; }
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
}

public record AdminShippingConfigDTO
{
    public DeliverySchedulingSettingsDTO Settings { get; init; } = default!;
    public required IReadOnlyList<DeliveryTimeSlotAdminDTO> TimeSlots { get; init; }
    public required IReadOnlyList<DeliveryPricingRuleDTO> PricingRules { get; init; }
    public required IReadOnlyList<DeliveryHolidayDTO> Holidays { get; init; }
    public required IReadOnlyList<BlockedDeliveryDateDTO> BlockedDates { get; init; }
}

public record UpdateDeliverySchedulingSettingsRequest
{
    public int MinLeadHours { get; init; }
    public int MaxScheduleDaysAhead { get; init; }
    public bool SchedulingEnabled { get; init; }
}

public record UpsertDeliveryTimeSlotRequest
{
    public required string Label { get; init; }
    public required string StartTime { get; init; }
    public required string EndTime { get; init; }
    public int Capacity { get; init; }
    public bool IsActive { get; init; } = true;
    public int SortOrder { get; init; }
}

public record CreateDeliveryHolidayRequest
{
    public required string Date { get; init; }
    public required string Name { get; init; }
}

public record CreateBlockedDeliveryDateRequest
{
    public required string Date { get; init; }
    public string? Reason { get; init; }
}
