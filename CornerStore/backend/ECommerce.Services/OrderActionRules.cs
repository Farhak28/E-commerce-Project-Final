using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.CommonResponses;

namespace ECommerce.Services;

internal static class OrderActionRules
{
    private const int ReturnWindowDays = 14;
    private const int MaxScheduleDaysAhead = 14;
    private static readonly TimeSpan MinScheduleLeadTime = TimeSpan.FromHours(2);

    public static bool CanCancel(Order order) =>
        order.Status is OrderStatus.Pending or OrderStatus.PaymentReceived
        && order.FulfillmentStage < FulfillmentStage.Shipped;

    public static bool CanReturn(Order order)
    {
        if (order.Status is OrderStatus.ReturnRequested or OrderStatus.Returned or OrderStatus.Cancelled or OrderStatus.PaymentFailed)
            return false;

        if (order.FulfillmentStage != FulfillmentStage.Delivered)
            return false;

        var windowStart = order.DeliveredAt ?? order.OrderDate;
        return windowStart.AddDays(ReturnWindowDays) >= DateTimeOffset.UtcNow;
    }

    public static bool CanReview(Order order) =>
        order.FulfillmentStage == FulfillmentStage.Delivered
        && order.Status is not OrderStatus.Cancelled and not OrderStatus.Returned;

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
