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

        public decimal GetTotal() => SubTotal + DeliveryMethod.Price;
    }
}
