using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ECommerce.Domain.Entities.OrderModule
{
    public class Order : BaseEntity<Guid>
    {
        public string UserEmail { get; set; } = default!;

        public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.Now;

        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public FulfillmentStage FulfillmentStage { get; set; } = FulfillmentStage.OrderPlaced;

        public string? TrackingNumber { get; set; }

        public string CarrierName { get; set; } = "Corner Store Logistics";

        public DateTimeOffset? ConfirmedAt { get; set; }

        public DateTimeOffset? ProcessingAt { get; set; }

        public DateTimeOffset? ShippedAt { get; set; }

        public DateTimeOffset? OutForDeliveryAt { get; set; }

        public DateTimeOffset? DeliveredAt { get; set; }

        public ICollection<OrderTrackingEvent> TrackingEvents { get; set; } = [];

        public OrderPaymentMethod PaymentMethod { get; set; } = OrderPaymentMethod.Card;

        public DateTimeOffset? ScheduledDeliveryAt { get; set; }

        public DateTimeOffset? CancelledAt { get; set; }

        public DateTimeOffset? ReturnRequestedAt { get; set; }

        public string? ReturnReason { get; set; }

        public string PaymentIntentId { get; set; } = default!;

        public OrderAddress Address { get; set; } = default!;

        public DeliveryMethod DeliveryMethod { get; set; } = default!;
        public int DeliveryMethodId { get; set; } //FK

        public ICollection<OrderItem> Items { get; set; } = [];

        public decimal SubTotal { get; set; } // Quantity * Price

        /// <summary>Delivery fee charged for this order (may include scheduled-slot surcharges).</summary>
        public decimal DeliveryPrice { get; set; }

        public string? CouponCode { get; set; }

        public Guid? UserCouponId { get; set; }

        public decimal DiscountAmount { get; set; }

        /// <summary>True when this order's item quantities have been subtracted from product stock.</summary>
        public bool StockDeducted { get; set; }

        public decimal GetTotal()
        {
            var delivery = DeliveryPrice > 0 ? DeliveryPrice : DeliveryMethod.Price;
            return Math.Max(0, SubTotal + delivery - DiscountAmount);
        }
    }
}
