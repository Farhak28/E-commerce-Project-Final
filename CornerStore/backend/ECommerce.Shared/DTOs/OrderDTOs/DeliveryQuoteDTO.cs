namespace ECommerce.Shared.DTOs.OrderDTOs;

public record DeliveryQuoteLineDTO(string Label, decimal Amount);

public record DeliveryQuoteDTO
{
    public int DeliveryMethodId { get; init; }
    public string DeliveryMethodName { get; init; } = default!;
    public decimal BasePrice { get; init; }
    public decimal TotalPrice { get; init; }
    public DateTimeOffset? ScheduledDeliveryAt { get; init; }
    /// <summary>Estimated arrival from delivery method window (e.g. end of "1-2 Days").</summary>
    public DateTimeOffset? EstimatedDeliveryDate { get; init; }
    /// <summary>Human-readable delivery window from the carrier (e.g. "1-2 Days").</summary>
    public string? DeliveryTime { get; init; }
    public IReadOnlyList<DeliveryQuoteLineDTO> Lines { get; init; } = [];
}
