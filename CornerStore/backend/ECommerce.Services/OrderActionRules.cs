using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.CommonResponses;

namespace ECommerce.Services;

internal static class OrderActionRules
{
    private const int ReturnWindowDays = 14;
    private const int MaxScheduleDaysAhead = 14;
    private static readonly TimeSpan MinScheduleLeadTime = TimeSpan.FromHours(2);

    public static bool CanCancel(Order order) =>
        order.Status is OrderStatus.Pending or OrderStatus.PaymentReceived;

    public static bool CanReturn(Order order)
    {
        if (order.Status != OrderStatus.PaymentReceived)
            return false;

        return order.OrderDate.AddDays(ReturnWindowDays) >= DateTimeOffset.UtcNow;
    }

    public static bool CanSchedule(Order order) =>
        order.Status is OrderStatus.Pending or OrderStatus.PaymentReceived;

    public static Result ValidateScheduledDelivery(DateTimeOffset scheduledAt)
    {
        var now = DateTimeOffset.UtcNow;
        if (scheduledAt <= now.Add(MinScheduleLeadTime))
            return Result.Fail(
                Error.Validation(
                    "Schedule.TooSoon",
                    "Choose a delivery time at least 2 hours from now."
                )
            );

        if (scheduledAt > now.AddDays(MaxScheduleDaysAhead))
            return Result.Fail(
                Error.Validation(
                    "Schedule.TooFar",
                    "Delivery can be scheduled up to 14 days ahead."
                )
            );

        return Result.Ok();
    }
}
