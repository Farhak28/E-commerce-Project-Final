namespace ECommerce.Shared.DTOs.AdminDTOs;

public record AdminAnalyticsDTO(
    IReadOnlyList<RevenueByMonthDTO> RevenueByMonth,
    IReadOnlyList<OrdersByStatusDTO> OrdersByStatus,
    IReadOnlyList<FulfillmentByStageDTO> FulfillmentByStage,
    int AssistantUsageEstimate,
    int ScheduledDeliveriesCount,
    decimal TotalDeliveryRevenue,
    decimal TotalDiscountsGiven,
    int VisualSearchEventsCount
);

public record RevenueByMonthDTO(string Label, decimal Amount);

public record OrdersByStatusDTO(string Status, int Count);

public record FulfillmentByStageDTO(string Stage, int Count);
