using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AccountDTOs;
namespace ECommerce.Services;

public class AccountService : IAccountService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthenticationService _authenticationService;
    private readonly IWishlistService _wishlistService;
    private readonly ICouponService _couponService;

    public AccountService(
        IUnitOfWork unitOfWork,
        IAuthenticationService authenticationService,
        IWishlistService wishlistService,
        ICouponService couponService
    )
    {
        _unitOfWork = unitOfWork;
        _authenticationService = authenticationService;
        _wishlistService = wishlistService;
        _couponService = couponService;
    }

    public async Task<Result<AccountDashboardDTO>> GetDashboardAsync(string email)
    {
        var orderSpec = new OrderSpecification(email);
        var orders = (await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(orderSpec)).ToList();

        var totalOrders = orders.Count;
        var activeOrders = orders.Count(o =>
            !o.Status.ToString().Contains("Delivered", StringComparison.OrdinalIgnoreCase)
            && !o.Status.ToString().Contains("Cancelled", StringComparison.OrdinalIgnoreCase)
        );

        var rewardPoints = totalOrders * 300 + (int)orders.Sum(o => o.SubTotal / 10);

        var loyaltyTier =
            totalOrders >= 20 ? "Platinum" : totalOrders >= 10 ? "Gold" : totalOrders >= 3 ? "Silver" : "Bronze";

        var addressResult = await _authenticationService.GetAddressesAsync(email);
        var hasAddress = addressResult.IsSuccess && addressResult.Value.Count > 0;
        var wishlist = await _wishlistService.GetWishlistAsync(email);
        var wishlistCount = wishlist.ProductIds.Count;

        var profileCompletion = 40;
        if (hasAddress) profileCompletion += 35;
        if (totalOrders > 0) profileCompletion += 15;
        if (wishlistCount > 0) profileCompletion += 10;
        profileCompletion = Math.Min(100, profileCompletion);

        var topInterests = orders
            .SelectMany(o => o.Items)
            .Select(i => i.Product?.ProductName ?? "")
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .GroupBy(n => GuessCategory(n))
            .OrderByDescending(g => g.Count())
            .Take(3)
            .Select(g => g.Key)
            .ToList();

        if (!topInterests.Any())
            topInterests = new List<string> { "Electronics", "Accessories", "Deals" };

        var preferences = new List<string>();
        if (hasAddress) preferences.Add("Saved shipping address");
        if (wishlistCount > 0) preferences.Add($"{wishlistCount} wishlist items");
        if (totalOrders > 0) preferences.Add("Order history synced");
        if (!preferences.Any())
            preferences.Add("Complete your profile and place your first order");

        var lastItem = orders
            .SelectMany(o => o.Items)
            .Select(i => i.Product?.ProductName)
            .LastOrDefault(n => !string.IsNullOrWhiteSpace(n));

        var coupons = await _couponService.SyncAndGetCouponsAsync(email);
        var availableCoupons = coupons.Count(c => !c.IsUsed && c.ExpiresAt > DateTimeOffset.UtcNow);

        var dashboard = new AccountDashboardDTO(
            totalOrders,
            activeOrders,
            rewardPoints,
            loyaltyTier,
            profileCompletion,
            availableCoupons,
            topInterests,
            preferences,
            lastItem != null ? $"Last ordered: {lastItem}" : null
        );

        return Result<AccountDashboardDTO>.Ok(dashboard);
    }

    private static string GuessCategory(string productName)
    {
        var lower = productName.ToLowerInvariant();
        if (lower.Contains("phone") || lower.Contains("iphone") || lower.Contains("samsung") || lower.Contains("xiaomi"))
            return "Phones";
        if (lower.Contains("laptop") || lower.Contains("macbook") || lower.Contains("zenbook"))
            return "Laptops";
        if (lower.Contains("watch") || lower.Contains("band"))
            return "Wearables";
        if (lower.Contains("headphone") || lower.Contains("speaker") || lower.Contains("airpods"))
            return "Audio";
        if (lower.Contains("keyboard") || lower.Contains("mouse") || lower.Contains("gaming"))
            return "Gaming";
        return "Accessories";
    }
}
