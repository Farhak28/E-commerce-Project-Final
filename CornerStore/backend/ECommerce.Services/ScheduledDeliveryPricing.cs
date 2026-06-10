using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services;

internal static class ScheduledDeliveryPricing
{
    private const decimal ExpressSurcharge = 8m;
    private const decimal NextDaySurcharge = 4m;
    private const decimal EveningPeakSurcharge = 3m;
    private const decimal WeekendSurcharge = 2m;
    private const decimal EconomyDiscountCap = 2m;

    public static decimal Calculate(decimal basePrice, DateTimeOffset? scheduledAt)
    {
        if (!scheduledAt.HasValue)
            return Round(basePrice);

        var breakdown = BuildBreakdown(basePrice, scheduledAt);
        return Round(Math.Max(0, breakdown.Sum(line => line.Amount)));
    }

    public static DeliveryQuoteDTO BuildQuote(
        int deliveryMethodId,
        string deliveryMethodName,
        decimal basePrice,
        DateTimeOffset? scheduledAt
    )
    {
        var lines = BuildBreakdown(basePrice, scheduledAt);
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
        DateTimeOffset? scheduledAt
    )
    {
        var lines = new List<DeliveryQuoteLineDTO>
        {
            new("Base delivery rate", Round(basePrice)),
        };

        if (!scheduledAt.HasValue)
            return lines;

        var now = DateTimeOffset.UtcNow;
        var scheduled = scheduledAt.Value;
        var lead = scheduled - now;

        if (lead <= TimeSpan.FromHours(24))
        {
            lines.Add(new DeliveryQuoteLineDTO("Express slot (within 24 hours)", ExpressSurcharge));
        }
        else if (lead <= TimeSpan.FromHours(48))
        {
            lines.Add(new DeliveryQuoteLineDTO("Next-day slot (24–48 hours)", NextDaySurcharge));
        }
        else if (lead >= TimeSpan.FromDays(7))
        {
            var discount = Round(Math.Min(EconomyDiscountCap, basePrice * 0.15m));
            if (discount > 0)
                lines.Add(new DeliveryQuoteLineDTO("Economy window (7+ days ahead)", -discount));
        }

        var hour = scheduled.Hour;
        if (hour >= 17 && hour < 21)
            lines.Add(new DeliveryQuoteLineDTO("Evening peak (5–9 PM)", EveningPeakSurcharge));

        if (scheduled.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            lines.Add(new DeliveryQuoteLineDTO("Weekend delivery", WeekendSurcharge));

        return lines;
    }

    private static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
