using ECommerce.Domain.Entities.OrderModule;

namespace ECommerce.Services.Specifications.OrderSpecifications;

internal class OrderWithTrackingSpecification : BaseSpecifications<Order, Guid>
{
    public OrderWithTrackingSpecification(Guid orderId)
        : base(o => o.Id == orderId)
    {
        AddInclude(o => o.DeliveryMethod);
        AddInclude(o => o.Items);
        AddInclude(o => o.TrackingEvents);
    }
}

internal class OrderSpecificationForFulfillment : BaseSpecifications<Order, Guid>
{
    public OrderSpecificationForFulfillment()
        : base(o =>
            o.Status != OrderStatus.Cancelled
            && o.Status != OrderStatus.PaymentFailed
            && o.Status != OrderStatus.ReturnRequested
            && o.Status != OrderStatus.Returned
            && o.FulfillmentStage != FulfillmentStage.Delivered
            && o.FulfillmentStage != FulfillmentStage.Cancelled
        )
    {
        AddInclude(o => o.TrackingEvents);
    }
}
