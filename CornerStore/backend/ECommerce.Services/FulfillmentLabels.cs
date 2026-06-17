using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Localization;

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

    public static string Headline(FulfillmentStage stage, string language = "en") =>
        FulfillmentStrings.Headline(stage, language);
}
