using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Shared.DTOs.OrderDTOs;

namespace ECommerce.Services;

internal static class OrderPaymentLabels
{
    public static string Format(OrderPaymentMethod method, string paymentIntentId)
    {
        if (paymentIntentId.StartsWith("cod-", StringComparison.OrdinalIgnoreCase))
            return "Cash on delivery";
        if (paymentIntentId.StartsWith("instapay-", StringComparison.OrdinalIgnoreCase))
            return "InstaPay";

        return method switch
        {
            OrderPaymentMethod.CashOnDelivery => "Cash on delivery",
            OrderPaymentMethod.InstaPay => "InstaPay",
            OrderPaymentMethod.ApplePay => "Apple Pay / Google Pay",
            _ => "Card / wallet",
        };
    }

    public static OrderPaymentMethod ToDomain(CheckoutPaymentMethod method) =>
        method switch
        {
            CheckoutPaymentMethod.ApplePay => OrderPaymentMethod.ApplePay,
            CheckoutPaymentMethod.InstaPay => OrderPaymentMethod.InstaPay,
            CheckoutPaymentMethod.CashOnDelivery => OrderPaymentMethod.CashOnDelivery,
            _ => OrderPaymentMethod.Card,
        };

    public static OrderPaymentMethod InferMethodFromPaymentIntentId(string paymentIntentId)
    {
        if (paymentIntentId.StartsWith("cod-", StringComparison.OrdinalIgnoreCase))
            return OrderPaymentMethod.CashOnDelivery;
        if (paymentIntentId.StartsWith("instapay-", StringComparison.OrdinalIgnoreCase))
            return OrderPaymentMethod.InstaPay;
        return OrderPaymentMethod.Card;
    }
}
