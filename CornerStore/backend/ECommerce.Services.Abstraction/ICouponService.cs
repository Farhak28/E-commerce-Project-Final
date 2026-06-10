using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AccountDTOs;
using ECommerce.Shared.DTOs.BasketDTOs;

namespace ECommerce.Services.Abstraction;

public interface ICouponService
{
    Task<IReadOnlyList<UserCouponDTO>> SyncAndGetCouponsAsync(string userEmail, CancellationToken ct = default);
    Task<Result<BasketDTO>> ApplyToBasketAsync(string userEmail, ApplyCouponDTO dto, CancellationToken ct = default);
    Task<Result<BasketDTO>> RemoveFromBasketAsync(string userEmail, string basketId, CancellationToken ct = default);
    Task<Result<decimal>> ValidateForOrderAsync(
        string userEmail,
        string code,
        decimal subtotal,
        decimal shippingPrice,
        CancellationToken ct = default
    );
    Task<Result<UserCoupon>> RedeemAsync(
        string userEmail,
        string code,
        Guid orderId,
        decimal subtotal,
        decimal shippingPrice,
        CancellationToken ct = default
    );
}
