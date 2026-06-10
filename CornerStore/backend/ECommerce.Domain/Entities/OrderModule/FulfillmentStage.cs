namespace ECommerce.Domain.Entities.OrderModule;

public enum FulfillmentStage
{
    OrderPlaced = 0,
    Confirmed = 1,
    Processing = 2,
    Shipped = 3,
    OutForDelivery = 4,
    Delivered = 5,
    Cancelled = 6,
    ReturnRequested = 7,
    Returned = 8,
}
