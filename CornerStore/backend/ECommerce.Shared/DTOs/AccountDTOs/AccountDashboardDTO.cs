namespace ECommerce.Shared.DTOs.AccountDTOs;

public record AccountDashboardDTO(
    int TotalOrders,
    int ActiveOrders,
    int RewardPoints,
    string LoyaltyTier,
    int ProfileCompletionPercent,
    int AvailableCoupons,
    IReadOnlyList<string> TopInterests,
    IReadOnlyList<string> SavedPreferences,
    string? LastViewedSummary
);
