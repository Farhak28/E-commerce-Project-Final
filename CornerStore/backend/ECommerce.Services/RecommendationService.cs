using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services;

public class RecommendationService : IRecommendationService
{
    private static readonly Dictionary<string, string[]> CategoryAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Smartphones"] = ["smartphones", "smartphone", "phone", "phones", "mobile", "iphone", "android"],
        ["Gaming"] = ["gaming", "gamer", "console", "games", "playstation", "xbox", "nintendo"],
        ["Laptops"] = ["laptops", "laptop", "notebook", "macbook", "macbooks"],
        ["Audio"] = ["audio", "headphone", "headphones", "earbud", "earbuds", "speaker", "speakers"],
        ["Accessories"] = ["accessories", "accessory", "case", "charger", "cable"],
        ["Smart Watches"] = ["smart watches", "smartwatch", "smartwatches", "wearable", "wearables", "watch", "watches", "fitness band"],
    };

    private readonly IProductService _productService;
    private readonly IWishlistService _wishlistService;
    private readonly IUnitOfWork _unitOfWork;

    public RecommendationService(
        IProductService productService,
        IWishlistService wishlistService,
        IUnitOfWork unitOfWork
    )
    {
        _productService = productService;
        _wishlistService = wishlistService;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ProductDTO>> GetTrendingAsync(int count = 8)
    {
        var all = await _productService.GetAllProductsForAdminAsync();
        return all
            .OrderByDescending(p => p.ReviewCount > 0 ? p.AverageRating : 0)
            .ThenByDescending(p => p.ReviewCount)
            .ThenByDescending(p => p.Id)
            .Take(count);
    }

    public Task<IEnumerable<ProductDTO>> GetSimilarAsync(int productId, int count = 5) =>
        _productService.GetRecommendedProductsAsync(productId, count);

    public async Task<IEnumerable<ProductDTO>> GetPersonalizedAsync(
        string? userEmail,
        int count = 8,
        IEnumerable<int>? cartProductIds = null,
        IEnumerable<int>? recentlyViewedIds = null
    )
    {
        var suggestions = new List<ProductDTO>();
        var seen = new HashSet<int>();

        foreach (var id in (cartProductIds ?? []).Distinct().Take(4))
            await AddSimilarForProductAsync(id, suggestions, seen, 3);

        foreach (var id in (recentlyViewedIds ?? []).Distinct().Take(4))
            await AddSimilarForProductAsync(id, suggestions, seen, 2);

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            try
            {
                var wishlist = await _wishlistService.GetWishlistAsync(userEmail);
                foreach (var productId in wishlist.ProductIds.Take(3))
                    await AddSimilarForProductAsync(productId, suggestions, seen, 3);
            }
            catch
            {
                // optional
            }

            var spec = new OrderSpecification();
            var orders = (await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(spec))
                .Where(o => o.UserEmail.Equals(userEmail, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(o => o.OrderDate)
                .Take(5);

            foreach (var order in orders)
            {
                foreach (var item in order.Items.Take(2))
                {
                    var search = item.Product?.ProductName;
                    if (string.IsNullOrWhiteSpace(search))
                        continue;
                    var page = await _productService.GetAllProductsAsync(
                        new ProductQueryParams { search = search, PageIndex = 1, PageSize = 10 }
                    );
                    foreach (var product in page.Data)
                    {
                        if (seen.Add(product.Id))
                            suggestions.Add(product);
                    }
                }
            }
        }

        if (suggestions.Count < count)
        {
            foreach (var item in await GetTrendingAsync(count))
            {
                if (seen.Add(item.Id))
                    suggestions.Add(item);
                if (suggestions.Count >= count)
                    break;
            }
        }

        return suggestions.Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetForProductIdsAsync(
        IEnumerable<int> productIds,
        int count = 8
    )
    {
        var suggestions = new List<ProductDTO>();
        var seen = new HashSet<int>(productIds);

        foreach (var id in productIds.Distinct().Take(5))
            await AddSimilarForProductAsync(id, suggestions, seen, 4);

        if (suggestions.Count < count)
        {
            foreach (var item in await GetTrendingAsync(count))
            {
                if (seen.Add(item.Id))
                    suggestions.Add(item);
                if (suggestions.Count >= count)
                    break;
            }
        }

        return suggestions.Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetByBudgetAsync(decimal maxPrice, int count = 8)
    {
        var all = await _productService.GetAllProductsForAdminAsync();
        return all
            .Where(p => p.Price <= maxPrice)
            .OrderByDescending(p => p.ReviewCount > 0 ? p.AverageRating : 0)
            .ThenBy(p => p.Price)
            .Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetByCategoryAsync(string category, int count = 8)
    {
        var all = await _productService.GetAllProductsForAdminAsync();
        var matchedType = await ResolveCategoryTypeNameAsync(category);

        IEnumerable<ProductDTO> filtered = matchedType is not null
            ? all.Where(p => p.ProductType.Equals(matchedType, StringComparison.OrdinalIgnoreCase))
            : all.Where(p =>
                p.Name.Contains(category, StringComparison.OrdinalIgnoreCase)
                || p.ProductType.Contains(category, StringComparison.OrdinalIgnoreCase)
                || p.ProductBrand.Contains(category, StringComparison.OrdinalIgnoreCase)
                || p.Description.Contains(category, StringComparison.OrdinalIgnoreCase));

        return filtered
            .OrderByDescending(p => p.ReviewCount > 0 ? p.AverageRating : 0)
            .ThenByDescending(p => p.ReviewCount)
            .Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetByPriceProximityAsync(
        int anchorProductId,
        int count = 6
    )
    {
        var anchor = await _productService.GetProductByIdAsync(anchorProductId);
        if (!anchor.IsSuccess)
            return await GetTrendingAsync(count);

        var all = await _productService.GetAllProductsForAdminAsync();
        var anchorPrice = anchor.Value.Price;
        return all
            .Where(p => p.Id != anchorProductId)
            .OrderBy(p => Math.Abs(p.Price - anchorPrice))
            .ThenByDescending(p => p.AverageRating)
            .Take(count);
    }

    private async Task<string?> ResolveCategoryTypeNameAsync(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return null;

        var types = (await _productService.GetAllTypesAsync()).ToList();
        var normalized = category.Trim().ToLowerInvariant();

        var exact = types.FirstOrDefault(t => t.Name.Equals(category, StringComparison.OrdinalIgnoreCase));
        if (exact is not null)
            return exact.Name;

        var slug = normalized.Replace(" ", "", StringComparison.Ordinal);
        foreach (var type in types)
        {
            if (type.Name.Replace(" ", "", StringComparison.Ordinal).Equals(slug, StringComparison.OrdinalIgnoreCase))
                return type.Name;
        }

        foreach (var type in types)
        {
            if (!CategoryAliases.TryGetValue(type.Name, out var aliases))
                continue;

            if (aliases.Any(a => normalized == a || normalized.Contains(a) || a.Contains(normalized)))
                return type.Name;
        }

        return types.FirstOrDefault(t =>
                t.Name.Contains(category, StringComparison.OrdinalIgnoreCase)
                || category.Contains(t.Name, StringComparison.OrdinalIgnoreCase)
            )
            ?.Name;
    }

    private async Task AddSimilarForProductAsync(
        int productId,
        List<ProductDTO> suggestions,
        HashSet<int> seen,
        int perProduct
    )
    {
        var similar = await _productService.GetRecommendedProductsAsync(productId, perProduct + 2);
        foreach (var item in similar)
        {
            if (seen.Add(item.Id))
                suggestions.Add(item);
        }
    }
}
