namespace ECommerce.Shared.DTOs.OrderDTOs;

public record ReturnOrderDTO
{
    public required string Reason { get; init; }
}
