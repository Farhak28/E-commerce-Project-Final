namespace ECommerce.Shared.DTOs.AccountDTOs;

public record UserCouponDTO
{
    public Guid Id { get; init; }
    public string Code { get; init; } = default!;
    public string Title { get; init; } = default!;
    public string Description { get; init; } = default!;
    public string DiscountType { get; init; } = default!;
    public decimal DiscountValue { get; init; }
    public decimal? MaxDiscount { get; init; }
    public decimal MinOrderAmount { get; init; }
    public bool IsUsed { get; init; }
    public DateTimeOffset ExpiresAt { get; init; }
    public string DiscountLabel { get; init; } = default!;
}
