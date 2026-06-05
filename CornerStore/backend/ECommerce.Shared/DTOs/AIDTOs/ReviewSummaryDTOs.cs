namespace ECommerce.Shared.DTOs.AIDTOs;

public record ReviewSummaryDTO(
    int ProductId,
    string ProductName,
    double AverageRating,
    int TotalReviews,
    double PositivePercentage,
    double NeutralPercentage,
    double NegativePercentage,
    IReadOnlyList<string> PositiveThemes,
    IReadOnlyList<string> NegativeThemes,
    string Summary
);

public record ComparisonProductDTO(
    int Id,
    string Name,
    string? PictureUrl,
    decimal Price,
    double AverageRating,
    int ReviewCount,
    int StockQuantity,
    string ProductType,
    string ProductBrand,
    string Description
);

public record ComparisonCardDTO(
    IReadOnlyList<ComparisonProductDTO> Products,
    string? RecommendedProductId
);

public record OrderStatusItemDTO(
    Guid Id,
    string Status,
    decimal Total,
    DateTime OrderDate
);

public record OrderStatusCardDTO(
    IReadOnlyList<OrderStatusItemDTO> Orders,
    OrderStatusItemDTO? HighlightedOrder
);

public record AssistantStructuredDataDTO(
    ComparisonCardDTO? Comparison = null,
    OrderStatusCardDTO? Orders = null,
    ReviewSummaryDTO? ReviewSummary = null
);
