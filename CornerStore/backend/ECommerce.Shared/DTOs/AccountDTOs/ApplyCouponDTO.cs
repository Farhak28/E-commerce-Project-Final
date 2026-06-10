namespace ECommerce.Shared.DTOs.AccountDTOs;

public record ApplyCouponDTO
{
    public required string BasketId { get; init; }
    public required string Code { get; init; }
}
