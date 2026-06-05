using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Shared.DTOs.AIDTOs;

public record VisualSearchRequestDTO(
    string ImageBase64,
    string MimeType,
    Guid? SessionId = null
);

public record VisualProductAttributesDTO(
    string? Category,
    string? ProductType,
    string? Brand,
    string? Color,
    string? Material,
    string? Style,
    string? ProductName,
    IReadOnlyList<string> Features,
    IReadOnlyList<string> Keywords,
    double Confidence
);

public record VisualProductMatchDTO(
    ProductDTO Product,
    int MatchPercentage,
    string MatchTier
);

public record VisualSearchResponseDTO(
    string Text,
    bool ExactMatchFound,
    VisualProductAttributesDTO Attributes,
    IReadOnlyList<VisualProductMatchDTO> ExactMatches,
    IReadOnlyList<VisualProductMatchDTO> SimilarProducts,
    IReadOnlyList<VisualProductMatchDTO> Alternatives,
    Guid? SessionId = null
);

public record VisualSearchAnalyticsDTO(
    int TotalSearches,
    int SearchesToday,
    double MatchSuccessRate,
    IReadOnlyList<DailyChatCountDTO> SearchesByDay,
    IReadOnlyList<KnowledgeCategoryCountDTO> TopCategories,
    IReadOnlyList<KnowledgeCategoryCountDTO> TopBrands
);
