using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ECommerce.Shared.DTOs.OrderDTOs
{
    public record OrderToReturnDTO
    {
        public Guid Id { get; init; }

        public required string UserEmail { get; init; }

        public required ICollection<OrderItemDTO> Items { get; init; }

        public required AddressDTO Address { get; init; }

        public required string DeliveryMethod { get; init; }

        public int DeliveryMethodId { get; init; }

        public required string PaymentIntentId { get; set; }

        public required string PaymentMethod { get; init; }

        public required string Status { get; init; }

        public string FulfillmentStage { get; init; } = "OrderPlaced";

        public string? TrackingNumber { get; init; }

        public string CarrierName { get; init; } = "Corner Store Logistics";

        public int ProgressPercent { get; init; }

        public string TrackingHeadline { get; init; } = "Order placed";

        public DateTimeOffset? ScheduledDeliveryAt { get; init; }

        public DateTimeOffset? CancelledAt { get; init; }

        public DateTimeOffset? ReturnRequestedAt { get; init; }

        public string? ReturnReason { get; init; }

        public bool CanCancel { get; init; }

        public bool CanReturn { get; init; }

        public bool CanSchedule { get; init; }

        public DateTimeOffset OrderDate { get; init; }

        public decimal Subtotal { get; init; }

        public decimal DeliveryPrice { get; init; }

        public string? CouponCode { get; init; }

        public decimal DiscountAmount { get; init; }

        public decimal Total { get; init; }
    }
}
