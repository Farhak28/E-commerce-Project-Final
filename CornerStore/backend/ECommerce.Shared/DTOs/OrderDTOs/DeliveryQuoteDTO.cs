namespace ECommerce.Shared.DTOs.OrderDTOs;

public record DeliveryQuoteLineDTO(string Label, decimal Amount);

public record DeliveryQuoteDTO
{
    public int DeliveryMethodId { get; init; }
    public string DeliveryMethodName { get; init; } = default!;
    public decimal BasePrice { get; init; }
    public decimal TotalPrice { get; init; }
    public DateTimeOffset? ScheduledDeliveryAt { get; init; }
    public IReadOnlyList<DeliveryQuoteLineDTO> Lines { get; init; } = [];
}
