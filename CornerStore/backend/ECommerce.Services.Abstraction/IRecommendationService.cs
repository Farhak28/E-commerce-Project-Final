using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services.Abstraction;

public interface IRecommendationService
{
    Task<IEnumerable<ProductDTO>> GetTrendingAsync(int count = 8);

    Task<IEnumerable<ProductDTO>> GetSimilarAsync(int productId, int count = 5);

    Task<IEnumerable<ProductDTO>> GetPersonalizedAsync(
        string? userEmail,
        int count = 8,
        IEnumerable<int>? cartProductIds = null,
        IEnumerable<int>? recentlyViewedIds = null
    );

    Task<IEnumerable<ProductDTO>> GetForProductIdsAsync(IEnumerable<int> productIds, int count = 8);

    Task<IEnumerable<ProductDTO>> GetByBudgetAsync(decimal maxPrice, int count = 8);

    Task<IEnumerable<ProductDTO>> GetByCategoryAsync(string category, int count = 8);

    Task<IEnumerable<ProductDTO>> GetByPriceProximityAsync(int anchorProductId, int count = 6);
}
