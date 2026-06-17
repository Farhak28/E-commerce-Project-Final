using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services;

/// <summary>
/// Backward-compatible entry point — delegates to <see cref="DeliveryPricingEngine"/> with DB rules.
/// </summary>
internal static class ScheduledDeliveryPricing
{
    public static decimal Calculate(
        decimal basePrice,
        DateTimeOffset? scheduledAt,
        IReadOnlyList<DeliveryPricingRule>? rules = null
    )
    {
        return DeliveryPricingEngine.Calculate(basePrice, scheduledAt, rules ?? []);
    }

    public static DeliveryQuoteDTO BuildQuote(
        int deliveryMethodId,
        string deliveryMethodName,
        decimal basePrice,
        DateTimeOffset? scheduledAt,
        IReadOnlyList<DeliveryPricingRule>? rules = null
    )
    {
        return DeliveryPricingEngine.BuildQuote(
            deliveryMethodId,
            deliveryMethodName,
            basePrice,
            scheduledAt,
            rules ?? []
        );
    }

    public static async Task<IReadOnlyList<DeliveryPricingRule>> LoadRulesAsync(IUnitOfWork unitOfWork)
    {
        var items = await unitOfWork.GetRepository<DeliveryPricingRule, int>().GetAllAsync();
        return items.Where(r => r.IsActive).OrderBy(r => r.SortOrder).ToList();
    }
}
