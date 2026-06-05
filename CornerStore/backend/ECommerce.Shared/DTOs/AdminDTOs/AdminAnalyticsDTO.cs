namespace ECommerce.Shared.DTOs.AdminDTOs;

public record AdminAnalyticsDTO(
    IReadOnlyList<RevenueByMonthDTO> RevenueByMonth,
    IReadOnlyList<OrdersByStatusDTO> OrdersByStatus,
    int AssistantUsageEstimate
);

public record RevenueByMonthDTO(string Label, decimal Amount);

public record OrdersByStatusDTO(string Status, int Count);
