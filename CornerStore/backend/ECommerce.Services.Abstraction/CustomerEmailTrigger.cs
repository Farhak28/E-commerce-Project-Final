namespace ECommerce.Services.Abstraction;

/// <summary>Events that send a customer email. In-app notifications may still be created separately.</summary>
public enum CustomerEmailTrigger
{
    OrderCreated,
    OrderInTransit,
    OrderOutForDelivery,
    OrderDelivered,
    OrderCancelled,
    DeliveryRescheduled,
    ReturnRequested,
    ReturnApproved,
    ReturnRejected,
    AccountWelcome,
    LoyaltyRewardUnlocked,
}
