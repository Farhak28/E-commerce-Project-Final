using ECommerce.Domain.Entities.OrderModule;

namespace ECommerce.Services;

internal sealed record PurchaseStats(int TotalOrders, decimal TotalSpend);

internal sealed record CouponRewardTemplate(
    string RewardKey,
    string Title,
    string Description,
    Func<PurchaseStats, bool> Qualifies,
    CouponDiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    decimal MinOrderAmount,
    int ValidDays
);

internal static class CouponRewardCatalog
{
    public static IReadOnlyList<CouponRewardTemplate> Templates { get; } =
    [
        new(
            "first_order",
            "Welcome back",
            "Thanks for your first order — enjoy 10% off your next purchase.",
            s => s.TotalOrders >= 1,
            CouponDiscountType.Percent,
            10m,
            15m,
            20m,
            60
        ),
        new(
            "orders_3",
            "Silver shopper",
            "You have 3+ orders with us. Take $5 off your cart.",
            s => s.TotalOrders >= 3,
            CouponDiscountType.FixedAmount,
            5m,
            null,
            25m,
            45
        ),
        new(
            "orders_5",
            "Regular customer",
            "Five orders unlocked — 12% off (up to $18).",
            s => s.TotalOrders >= 5,
            CouponDiscountType.Percent,
            12m,
            18m,
            30m,
            45
        ),
        new(
            "orders_10",
            "Gold member",
            "Ten orders — 15% off (up to $30).",
            s => s.TotalOrders >= 10,
            CouponDiscountType.Percent,
            15m,
            30m,
            40m,
            60
        ),
        new(
            "orders_20",
            "Platinum VIP",
            "Twenty orders — 20% off (up to $50).",
            s => s.TotalOrders >= 20,
            CouponDiscountType.Percent,
            20m,
            50m,
            50m,
            90
        ),
        new(
            "spend_100",
            "Century club",
            "You've spent $100+ — enjoy $8 off.",
            s => s.TotalSpend >= 100m,
            CouponDiscountType.FixedAmount,
            8m,
            null,
            35m,
            45
        ),
        new(
            "spend_250",
            "Big spender",
            "Lifetime spend $250+ — $15 off your order.",
            s => s.TotalSpend >= 250m,
            CouponDiscountType.FixedAmount,
            15m,
            null,
            50m,
            60
        ),
        new(
            "spend_500",
            "Corner Store elite",
            "Lifetime spend $500+ — $25 off.",
            s => s.TotalSpend >= 500m,
            CouponDiscountType.FixedAmount,
            25m,
            null,
            75m,
            90
        ),
        new(
            "free_ship_7",
            "Free delivery treat",
            "Seven orders earned you free shipping on your next order.",
            s => s.TotalOrders >= 7,
            CouponDiscountType.FreeShipping,
            0m,
            null,
            15m,
            30
        ),
    ];
}
