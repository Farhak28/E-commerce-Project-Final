namespace ECommerce.Domain.Entities.OrderModule;

public class UserCoupon : BaseEntity<Guid>
{
    public string UserEmail { get; set; } = default!;

    /// <summary>Stable key so the same reward is not issued twice (e.g. orders_5, spend_250).</summary>
    public string RewardKey { get; set; } = default!;

    public string Code { get; set; } = default!;

    public string Title { get; set; } = default!;

    public string Description { get; set; } = default!;

    public CouponDiscountType DiscountType { get; set; }

    public decimal DiscountValue { get; set; }

    public decimal? MaxDiscount { get; set; }

    public decimal MinOrderAmount { get; set; }

    public bool IsUsed { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public Guid? UsedOrderId { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
