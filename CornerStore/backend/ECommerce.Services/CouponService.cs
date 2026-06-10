using AutoMapper;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.BasketModule;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AccountDTOs;
using ECommerce.Shared.DTOs.BasketDTOs;

namespace ECommerce.Services;

public sealed class CouponService : ICouponService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBasketRepository _basketRepository;
    private readonly IMapper _mapper;

    public CouponService(IUnitOfWork unitOfWork, IBasketRepository basketRepository, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _basketRepository = basketRepository;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<UserCouponDTO>> SyncAndGetCouponsAsync(
        string userEmail,
        CancellationToken ct = default
    )
    {
        await SyncCouponsAsync(userEmail, ct);

        var repo = _unitOfWork.GetRepository<UserCoupon, Guid>();
        var coupons = (await repo.GetAllAsync(new UserCouponsForEmailSpecification(userEmail)))
            .OrderByDescending(c => c.CreatedAt)
            .ToList();

        return coupons.Select(MapCoupon).ToList();
    }

    public async Task<Result<BasketDTO>> ApplyToBasketAsync(
        string userEmail,
        ApplyCouponDTO dto,
        CancellationToken ct = default
    )
    {
        var basket = await _basketRepository.GetBasketAsync(dto.BasketId);
        if (basket is null)
            return Error.NotFound("Basket.NotFound", "Cart not found.");

        if (!basket.Items.Any())
            return Error.Validation("Basket.Empty", "Add items before applying a coupon.");

        var subtotal = basket.Items.Sum(i => i.Price * i.Quantity);
        var shipping = basket.ShippingPrice;
        var validation = await ValidateForOrderAsync(userEmail, dto.Code, subtotal, shipping, ct);
        if (!validation.IsSuccess)
            return Result<BasketDTO>.Fail(validation.Errors.ToList());

        basket.CouponCode = dto.Code.Trim().ToUpperInvariant();
        basket.DiscountAmount = validation.Value;
        await _basketRepository.CreateOrUpdateBasketAsync(basket);

        return _mapper.Map<BasketDTO>(basket);
    }

    public async Task<Result<BasketDTO>> RemoveFromBasketAsync(
        string userEmail,
        string basketId,
        CancellationToken ct = default
    )
    {
        var basket = await _basketRepository.GetBasketAsync(basketId);
        if (basket is null)
            return Error.NotFound("Basket.NotFound", "Cart not found.");

        basket.CouponCode = null;
        basket.DiscountAmount = 0;
        await _basketRepository.CreateOrUpdateBasketAsync(basket);

        return _mapper.Map<BasketDTO>(basket);
    }

    public async Task<Result<decimal>> ValidateForOrderAsync(
        string userEmail,
        string code,
        decimal subtotal,
        decimal shippingPrice,
        CancellationToken ct = default
    )
    {
        if (string.IsNullOrWhiteSpace(code))
            return Error.Validation("Coupon.Required", "Enter a coupon code.");

        var normalized = code.Trim().ToUpperInvariant();
        var coupon = await FindActiveCouponAsync(userEmail, normalized, ct);
        if (coupon is null)
            return Error.Validation("Coupon.Invalid", "This coupon is not valid for your account.");

        if (subtotal < coupon.MinOrderAmount)
            return Error.Validation(
                "Coupon.MinOrder",
                $"Minimum order amount is ${coupon.MinOrderAmount:0.00} before discount."
            );

        var discount = CalculateDiscount(coupon, subtotal, shippingPrice);
        if (discount <= 0)
            return Error.Validation("Coupon.NoDiscount", "This coupon does not apply to this order.");

        return discount;
    }

    public async Task<Result<UserCoupon>> RedeemAsync(
        string userEmail,
        string code,
        Guid orderId,
        decimal subtotal,
        decimal shippingPrice,
        CancellationToken ct = default
    )
    {
        var validation = await ValidateForOrderAsync(userEmail, code, subtotal, shippingPrice, ct);
        if (!validation.IsSuccess)
            return Result<UserCoupon>.Fail(validation.Errors.ToList());

        var normalized = code.Trim().ToUpperInvariant();
        var coupon = await FindActiveCouponAsync(userEmail, normalized, ct);
        if (coupon is null)
            return Error.Validation("Coupon.Invalid", "This coupon is not valid for your account.");

        coupon.IsUsed = true;
        coupon.UsedAt = DateTimeOffset.UtcNow;
        coupon.UsedOrderId = orderId;

        _unitOfWork.GetRepository<UserCoupon, Guid>().Update(coupon);
        await _unitOfWork.SaveChangesAsync();

        return coupon;
    }

    internal static decimal CalculateDiscount(UserCoupon coupon, decimal subtotal, decimal shippingPrice)
    {
        decimal discount = coupon.DiscountType switch
        {
            CouponDiscountType.Percent => subtotal * (coupon.DiscountValue / 100m),
            CouponDiscountType.FixedAmount => coupon.DiscountValue,
            CouponDiscountType.FreeShipping => shippingPrice,
            _ => 0m,
        };

        if (coupon.MaxDiscount.HasValue)
            discount = Math.Min(discount, coupon.MaxDiscount.Value);

        var maxApplicable = subtotal + shippingPrice;
        return Math.Round(Math.Min(discount, maxApplicable), 2, MidpointRounding.AwayFromZero);
    }

    private async Task SyncCouponsAsync(string userEmail, CancellationToken ct)
    {
        var stats = await BuildPurchaseStatsAsync(userEmail, ct);
        var repo = _unitOfWork.GetRepository<UserCoupon, Guid>();
        var existing = (await repo.GetAllAsync(new UserCouponsForEmailSpecification(userEmail)))
            .ToDictionary(c => c.RewardKey, StringComparer.OrdinalIgnoreCase);

        var changed = false;
        foreach (var template in CouponRewardCatalog.Templates)
        {
            if (!template.Qualifies(stats))
                continue;
            if (existing.ContainsKey(template.RewardKey))
                continue;

            var coupon = new UserCoupon
            {
                Id = Guid.NewGuid(),
                UserEmail = userEmail,
                RewardKey = template.RewardKey,
                Code = GenerateCode(template.RewardKey, userEmail),
                Title = template.Title,
                Description = template.Description,
                DiscountType = template.DiscountType,
                DiscountValue = template.DiscountValue,
                MaxDiscount = template.MaxDiscount,
                MinOrderAmount = template.MinOrderAmount,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(template.ValidDays),
            };

            await repo.AddAsync(coupon);
            changed = true;
        }

        if (changed)
            await _unitOfWork.SaveChangesAsync();
    }

    private async Task<PurchaseStats> BuildPurchaseStatsAsync(string userEmail, CancellationToken ct)
    {
        var orders = (
            await _unitOfWork
                .GetRepository<Order, Guid>()
                .GetAllAsync(new OrderSpecification(userEmail))
        ).ToList();

        var qualifying = orders
            .Where(o =>
                o.Status
                    is OrderStatus.PaymentReceived
                        or OrderStatus.Pending
                        or OrderStatus.ReturnRequested
            )
            .ToList();

        var totalSpend = qualifying.Sum(o =>
            o.SubTotal + (o.DeliveryPrice > 0 ? o.DeliveryPrice : o.DeliveryMethod?.Price ?? 0)
        );

        return new PurchaseStats(qualifying.Count, totalSpend);
    }

    private async Task<UserCoupon?> FindActiveCouponAsync(
        string userEmail,
        string code,
        CancellationToken ct
    )
    {
        await SyncCouponsAsync(userEmail, ct);

        var coupons = await _unitOfWork
            .GetRepository<UserCoupon, Guid>()
            .GetAllAsync(new UserCouponByCodeSpecification(userEmail, code));

        return coupons.FirstOrDefault(c =>
            !c.IsUsed && c.ExpiresAt > DateTimeOffset.UtcNow
        );
    }

    private static string GenerateCode(string rewardKey, string userEmail)
    {
        var hash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes($"{rewardKey}:{userEmail}")
            )
        )[..6];

        var prefix = rewardKey switch
        {
            "first_order" => "WELCOME",
            "orders_3" => "SILVER",
            "orders_5" => "LOYAL",
            "orders_10" => "GOLD",
            "orders_20" => "VIP",
            "spend_100" => "SPEND100",
            "spend_250" => "SPEND250",
            "spend_500" => "SPEND500",
            "free_ship_7" => "FREESHIP",
            _ => "SAVE",
        };

        return $"{prefix}-{hash}";
    }

    private static UserCouponDTO MapCoupon(UserCoupon coupon) =>
        new()
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Title = coupon.Title,
            Description = coupon.Description,
            DiscountType = coupon.DiscountType.ToString(),
            DiscountValue = coupon.DiscountValue,
            MaxDiscount = coupon.MaxDiscount,
            MinOrderAmount = coupon.MinOrderAmount,
            IsUsed = coupon.IsUsed,
            ExpiresAt = coupon.ExpiresAt,
            DiscountLabel = FormatDiscountLabel(coupon),
        };

    private static string FormatDiscountLabel(UserCoupon coupon) =>
        coupon.DiscountType switch
        {
            CouponDiscountType.Percent =>
                coupon.MaxDiscount.HasValue
                    ? $"{coupon.DiscountValue:0}% off (max ${coupon.MaxDiscount:0.00})"
                    : $"{coupon.DiscountValue:0}% off",
            CouponDiscountType.FixedAmount => $"${coupon.DiscountValue:0.00} off",
            CouponDiscountType.FreeShipping => "Free shipping",
            _ => "Discount",
        };
}
