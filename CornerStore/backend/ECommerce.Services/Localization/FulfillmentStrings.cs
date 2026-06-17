using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.Localization;

namespace ECommerce.Services.Localization;

public static class FulfillmentStrings
{
    public static string Headline(FulfillmentStage stage, string language) =>
        stage switch
        {
            FulfillmentStage.Delivered => StoreLocale.Pick(language, "Delivered", "تم التسليم"),
            FulfillmentStage.OutForDelivery => StoreLocale.Pick(language, "Arriving today", "يصل اليوم"),
            FulfillmentStage.Shipped => StoreLocale.Pick(language, "On the way", "في الطريق"),
            FulfillmentStage.Processing => StoreLocale.Pick(language, "Preparing your order", "جاري تجهيز طلبك"),
            FulfillmentStage.Confirmed => StoreLocale.Pick(language, "Order confirmed", "تم تأكيد الطلب"),
            FulfillmentStage.OrderPlaced => StoreLocale.Pick(language, "Order placed", "تم الطلب"),
            FulfillmentStage.Cancelled => StoreLocale.Pick(language, "Cancelled", "ملغى"),
            FulfillmentStage.ReturnRequested => StoreLocale.Pick(language, "Return in progress", "الإرجاع قيد المعالجة"),
            FulfillmentStage.Returned => StoreLocale.Pick(language, "Returned", "مُرتجع"),
            _ => StoreLocale.Pick(language, "Tracking", "التتبع"),
        };

    public static (string Headline, string Subheadline) Headlines(Order order, string language)
    {
        return order.FulfillmentStage switch
        {
            FulfillmentStage.Delivered => (
                Headline(FulfillmentStage.Delivered, language),
                StoreLocale.Pick(language, "Your package has been delivered.", "تم تسليم طردك.")
            ),
            FulfillmentStage.OutForDelivery => (
                Headline(FulfillmentStage.OutForDelivery, language),
                StoreLocale.Pick(
                    language,
                    "Out for delivery in {city}.",
                    "خرج للتسليم في {city}.",
                    ("city", order.Address.City)
                )
            ),
            FulfillmentStage.Shipped => (
                Headline(FulfillmentStage.Shipped, language),
                order.TrackingNumber is not null
                    ? StoreLocale.Pick(
                        language,
                        "Tracking ID {tracking}",
                        "رقم التتبع {tracking}",
                        ("tracking", order.TrackingNumber)
                    )
                    : StoreLocale.Pick(language, "Your package left our warehouse.", "غادر طردك مستودعنا.")
            ),
            FulfillmentStage.Processing => (
                Headline(FulfillmentStage.Processing, language),
                StoreLocale.Pick(language, "We're packing your items.", "نقوم بتجهيز منتجاتك.")
            ),
            FulfillmentStage.Confirmed => (
                Headline(FulfillmentStage.Confirmed, language),
                StoreLocale.Pick(language, "We'll notify you at each step.", "سنُعلمك في كل خطوة.")
            ),
            FulfillmentStage.OrderPlaced => (
                Headline(FulfillmentStage.OrderPlaced, language),
                StoreLocale.Pick(language, "Waiting for confirmation.", "في انتظار التأكيد.")
            ),
            FulfillmentStage.Cancelled => (
                Headline(FulfillmentStage.Cancelled, language),
                StoreLocale.Pick(language, "This shipment was cancelled.", "تم إلغاء هذه الشحنة.")
            ),
            FulfillmentStage.ReturnRequested => (
                Headline(FulfillmentStage.ReturnRequested, language),
                StoreLocale.Pick(language, "We've received your return request.", "استلمنا طلب الإرجاع.")
            ),
            FulfillmentStage.Returned => (
                Headline(FulfillmentStage.Returned, language),
                StoreLocale.Pick(language, "This order was returned.", "تم إرجاع هذا الطلب.")
            ),
            _ => (
                Headline(order.FulfillmentStage, language),
                StoreLocale.Pick(language, "Follow your order below.", "تابع طلبك أدناه.")
            ),
        };
    }

    public static (string Title, string Description, string? Location) StepCopy(
        FulfillmentStage stage,
        Order order,
        string language
    ) =>
        stage switch
        {
            FulfillmentStage.OrderPlaced => (
                StoreLocale.Pick(language, "Order placed", "تم الطلب"),
                StoreLocale.Pick(language, "We received your order.", "استلمنا طلبك."),
                order.Address.City
            ),
            FulfillmentStage.Confirmed => (
                StoreLocale.Pick(language, "Order confirmed", "تم تأكيد الطلب"),
                StoreLocale.Pick(language, "Your order is confirmed and queued for fulfillment.", "تم تأكيد طلبك وهو في قائمة التجهيز."),
                StoreLocale.Pick(language, "Corner Store — Cairo hub", "كورنر ستور — مركز القاهرة")
            ),
            FulfillmentStage.Processing => (
                StoreLocale.Pick(language, "Processing at warehouse", "قيد التجهيز في المستودع"),
                StoreLocale.Pick(language, "We're picking and packing your items.", "نقوم بانتقاء وتغليف منتجاتك."),
                StoreLocale.Pick(language, "Corner Store warehouse", "مستودع كورنر ستور")
            ),
            FulfillmentStage.Shipped => (
                StoreLocale.Pick(language, "Shipped", "تم الشحن"),
                StoreLocale.Pick(
                    language,
                    "Package handed to {carrier}.",
                    "تم تسليم الطرد إلى {carrier}.",
                    ("carrier", order.CarrierName)
                ),
                StoreLocale.Pick(language, "Cairo distribution center", "مركز توزيع القاهرة")
            ),
            FulfillmentStage.OutForDelivery => (
                StoreLocale.Pick(language, "Out for delivery", "خرج للتسليم"),
                StoreLocale.Pick(language, "Your package is on the delivery vehicle.", "طردك على مركبة التوصيل."),
                order.Address.City
            ),
            FulfillmentStage.Delivered => (
                StoreLocale.Pick(language, "Delivered", "تم التسليم"),
                StoreLocale.Pick(language, "Package delivered. Enjoy your purchase!", "تم التسليم. نتمنى لك تسوقاً ممتعاً!"),
                order.Address.City
            ),
            FulfillmentStage.ReturnRequested => (
                StoreLocale.Pick(language, "Return requested", "طلب إرجاع"),
                StoreLocale.Pick(language, "We received your return request and will arrange pickup.", "استلمنا طلب الإرجاع وسنرتب الاستلام."),
                order.Address.City
            ),
            FulfillmentStage.Returned => (
                StoreLocale.Pick(language, "Return completed", "اكتمل الإرجاع"),
                StoreLocale.Pick(language, "Your return was approved and processed.", "تمت الموافقة على إرجاعك ومعالجته."),
                order.Address.City
            ),
            FulfillmentStage.Cancelled => (
                StoreLocale.Pick(language, "Cancelled", "ملغى"),
                StoreLocale.Pick(language, "This order was cancelled.", "تم إلغاء هذا الطلب."),
                order.Address.City
            ),
            _ => (stage.ToString(), "", null),
        };
}
