using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ECommerce.Shared.DTOs.OrderDTOs
{
    public record OrderDTO
    {
        public required string BasketId { get; init; }

        public int DeliveryMethodId { get; init; }

        public required AddressDTO ShipToAddress { get; init; }

        public CheckoutPaymentMethod PaymentMethod { get; init; } = CheckoutPaymentMethod.Card;

        public DateTimeOffset? ScheduledDeliveryAt { get; init; }

        public string? CouponCode { get; init; }
    }
}
