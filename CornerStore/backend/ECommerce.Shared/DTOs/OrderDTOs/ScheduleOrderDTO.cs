namespace ECommerce.Shared.DTOs.OrderDTOs;

public record ScheduleOrderDTO
{
    public required DateTimeOffset ScheduledDeliveryAt { get; init; }
}
