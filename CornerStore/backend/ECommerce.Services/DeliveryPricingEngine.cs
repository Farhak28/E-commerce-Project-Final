using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services;

/// <summary>Applies configurable pricing rules from the database (no hardcoded amounts).</summary>
internal static class DeliveryPricingEngine
{
    public static decimal Calculate(decimal basePrice, DateTimeOffset? scheduledAt, IReadOnlyList<DeliveryPricingRule> rules)
    {
        if (!scheduledAt.HasValue)
            return Round(basePrice);

        var breakdown = BuildBreakdown(basePrice, scheduledAt, rules);
        return Round(Math.Max(0, breakdown.Sum(line => line.Amount)));
    }

    public static DeliveryQuoteDTO BuildQuote(
        int deliveryMethodId,
        string deliveryMethodName,
        decimal basePrice,
        DateTimeOffset? scheduledAt,
        IReadOnlyList<DeliveryPricingRule> rules
    )
    {
        var lines = BuildBreakdown(basePrice, scheduledAt, rules);
        var total = Round(Math.Max(0, lines.Sum(line => line.Amount)));

        return new DeliveryQuoteDTO
        {
            DeliveryMethodId = deliveryMethodId,
            DeliveryMethodName = deliveryMethodName,
            BasePrice = Round(basePrice),
            TotalPrice = total,
            ScheduledDeliveryAt = scheduledAt,
            Lines = lines,
        };
    }

    private static List<DeliveryQuoteLineDTO> BuildBreakdown(
        decimal basePrice,
        DateTimeOffset? scheduledAt,
        IReadOnlyList<DeliveryPricingRule> rules
    )
    {
        var lines = new List<DeliveryQuoteLineDTO> { new("Base delivery rate", Round(basePrice)) };
        if (!scheduledAt.HasValue)
            return lines;

        var now = DateTimeOffset.UtcNow;
        var scheduled = scheduledAt.Value;
        var leadHours = (scheduled - now).TotalHours;

        foreach (var rule in rules)
        {
            var amount = EvaluateRule(rule, basePrice, scheduled, leadHours);
            if (amount is null or 0)
                continue;
            lines.Add(new DeliveryQuoteLineDTO(rule.Label, amount.Value));
        }

        return lines;
    }

    private static decimal? EvaluateRule(
        DeliveryPricingRule rule,
        decimal basePrice,
        DateTimeOffset scheduled,
        double leadHours
    )
    {
        switch (rule.RuleType)
        {
            case DeliveryPricingRuleType.ExpressSlot:
                if (rule.MaxLeadHours.HasValue && leadHours <= rule.MaxLeadHours.Value
                    && (!rule.MinLeadHours.HasValue || leadHours >= rule.MinLeadHours.Value))
                    return Round(rule.Amount);
                break;

            case DeliveryPricingRuleType.NextDaySlot:
                if (rule.MinLeadHours.HasValue && rule.MaxLeadHours.HasValue
                    && leadHours > rule.MinLeadHours.Value && leadHours <= rule.MaxLeadHours.Value)
                    return Round(rule.Amount);
                break;

            case DeliveryPricingRuleType.EconomyDiscount:
                if (rule.MinLeadDays.HasValue && leadHours >= rule.MinLeadDays.Value * 24)
                {
                    var percentDiscount = rule.PercentOfBaseCap.HasValue
                        ? Round(basePrice * rule.PercentOfBaseCap.Value)
                        : 0m;
                    var cap = rule.Amount > 0 ? Round(rule.Amount) : percentDiscount;
                    var discount = rule.PercentOfBaseCap.HasValue && rule.Amount > 0
                        ? Round(Math.Min(cap, percentDiscount))
                        : (percentDiscount > 0 ? percentDiscount : cap);
                    return discount > 0 ? -discount : null;
                }
                break;

            case DeliveryPricingRuleType.EveningPeak:
                if (rule.WindowStartHour.HasValue && rule.WindowEndHour.HasValue)
                {
                    var hour = scheduled.Hour;
                    if (hour >= rule.WindowStartHour.Value && hour < rule.WindowEndHour.Value)
                        return Round(rule.Amount);
                }
                break;

            case DeliveryPricingRuleType.Weekend:
                if (rule.DayOfWeek.HasValue)
                {
                    if (scheduled.DayOfWeek == rule.DayOfWeek.Value)
                        return Round(rule.Amount);
                }
                else if (scheduled.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                {
                    return Round(rule.Amount);
                }
                break;
        }

        return null;
    }

    private static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
