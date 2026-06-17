namespace ECommerce.Shared.Localization;

public static class NotificationStrings
{
    public static (string Title, string Body) Localize(string title, string body, string language)
    {
        if (StoreLocale.Normalize(language) != StoreLocale.Arabic)
            return (title, body);

        return (LocalizeTitle(title), LocalizeBody(title, body));
    }

    private static string LocalizeTitle(string title) =>
        title switch
        {
            "Order placed" => "تم الطلب",
            "Order cancelled" => "تم إلغاء الطلب",
            "Delivery scheduled" => "تم جدولة التوصيل",
            "Delivery rescheduled" => "تم إعادة جدولة التوصيل",
            "Return requested" => "طلب إرجاع",
            "Return approved" => "تمت الموافقة على الإرجاع",
            "Return not approved" => "لم تتم الموافقة على الإرجاع",
            "Order delivered — rate your items" => "تم التسليم — قيّم منتجاتك",
            "Order confirmed" => "تم تأكيد الطلب",
            "Order processing" => "جاري تجهيز الطلب",
            "Order shipped" => "تم شحن الطلب",
            "Out for delivery" => "في الطريق للتسليم",
            _ => title,
        };

    private static string LocalizeBody(string title, string body)
    {
        if (body.StartsWith("We received your order", StringComparison.OrdinalIgnoreCase))
            return body.Replace(
                "We received your order",
                "استلمنا طلبك",
                StringComparison.OrdinalIgnoreCase
            );

        if (body.StartsWith("Your order was cancelled", StringComparison.OrdinalIgnoreCase))
            return "تم إلغاء طلبك.";

        if (body.StartsWith("We received your return request", StringComparison.OrdinalIgnoreCase))
            return body.Replace(
                "We received your return request for order",
                "استلمنا طلب الإرجاع للطلب",
                StringComparison.OrdinalIgnoreCase
            );

        if (body.StartsWith("Your return for order", StringComparison.OrdinalIgnoreCase) && body.Contains("approved"))
            return body.Replace(
                "Your return for order",
                "تمت الموافقة على إرجاع الطلب",
                StringComparison.OrdinalIgnoreCase
            ).Replace("was approved. Refund processing may take a few business days.", "قد تستغرق معالجة الاسترداد بضعة أيام عمل.");

        if (body.StartsWith("We could not approve the return", StringComparison.OrdinalIgnoreCase))
            return body.Replace(
                "We could not approve the return for order",
                "لم نتمكن من الموافقة على إرجاع الطلب",
                StringComparison.OrdinalIgnoreCase
            );

        if (body.StartsWith("Order #", StringComparison.OrdinalIgnoreCase) && body.Contains("delivered"))
            return body.Replace(
                "was delivered. Open your order to leave star ratings and reviews.",
                "تم تسليمه. افتح طلبك لترك التقييمات والمراجعات.",
                StringComparison.OrdinalIgnoreCase
            );

        if (body.Contains("scheduled for delivery", StringComparison.OrdinalIgnoreCase))
            return body.Replace("scheduled for delivery", "مجدول للتوصيل", StringComparison.OrdinalIgnoreCase);

        if (body.Contains("has been rescheduled for", StringComparison.OrdinalIgnoreCase))
            return body.Replace("has been rescheduled for", "أُعيد جدولته لـ", StringComparison.OrdinalIgnoreCase);

        return body;
    }
}
