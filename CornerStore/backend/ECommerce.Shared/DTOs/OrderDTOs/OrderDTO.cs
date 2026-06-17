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

        public DeliveryTypeDto DeliveryType { get; init; } = DeliveryTypeDto.Standard;

        public DateTimeOffset? ScheduledDeliveryAt { get; init; }

        /// <summary>Calendar date for scheduled delivery (yyyy-MM-dd).</summary>
        public string? ScheduledDate { get; init; }

        public int? DeliveryTimeSlotId { get; init; }

        public string? CouponCode { get; init; }
    }
}
