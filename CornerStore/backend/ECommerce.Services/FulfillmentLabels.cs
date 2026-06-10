using ECommerce.Domain.Entities.OrderModule;

namespace ECommerce.Services;

internal static class FulfillmentLabels
{
    public static int ProgressPercent(FulfillmentStage stage) =>
        stage switch
        {
            FulfillmentStage.Delivered => 100,
            FulfillmentStage.OutForDelivery => 85,
            FulfillmentStage.Shipped => 65,
            FulfillmentStage.Processing => 45,
            FulfillmentStage.Confirmed => 25,
            FulfillmentStage.OrderPlaced => 10,
            _ => 0,
        };

    public static string Headline(FulfillmentStage stage) =>
        stage switch
        {
            FulfillmentStage.Delivered => "Delivered",
            FulfillmentStage.OutForDelivery => "Arriving today",
            FulfillmentStage.Shipped => "On the way",
            FulfillmentStage.Processing => "Preparing your order",
            FulfillmentStage.Confirmed => "Order confirmed",
            FulfillmentStage.OrderPlaced => "Order placed",
            FulfillmentStage.Cancelled => "Cancelled",
            FulfillmentStage.ReturnRequested => "Return in progress",
            FulfillmentStage.Returned => "Returned",
            _ => "Tracking",
        };
}
