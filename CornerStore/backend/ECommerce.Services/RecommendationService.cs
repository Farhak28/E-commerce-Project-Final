using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services;

public class RecommendationService : IRecommendationService
{
    private static readonly HashSet<OrderStatus> ExcludedOrderStatuses =
    [
        OrderStatus.Cancelled,
        OrderStatus.PaymentFailed,
    ];

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
        var lines = await LoadOrderLinesAsync();
        if (lines.Count > 0)
        {
            var purchased = await ResolveProductsByPurchaseVolumeAsync(lines, count, []);
            if (purchased.Count > 0)
                return purchased;
        }

        return await GetReviewTrendingAsync(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetSimilarAsync(int productId, int count = 5)
    {
        var coPurchased = await GetCoPurchasedProductsAsync([productId], [productId], count);
        if (coPurchased.Count >= count)
            return coPurchased.Take(count);

        var suggestions = coPurchased.ToList();
        var seen = new HashSet<int>(suggestions.Select(p => p.Id)) { productId };

        foreach (var item in await _productService.GetRecommendedProductsAsync(productId, count + 2))
        {
            if (seen.Add(item.Id))
                suggestions.Add(item);
            if (suggestions.Count >= count)
                break;
        }

        return suggestions.Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetBoughtTogetherAsync(int productId, int count = 6) =>
        await GetCoPurchasedProductsAsync([productId], [productId], count);

    public async Task<IEnumerable<ProductDTO>> GetPersonalizedAsync(
        string? userEmail,
        int count = 8,
        IEnumerable<int>? cartProductIds = null,
        IEnumerable<int>? recentlyViewedIds = null
    )
    {
        var suggestions = new List<ProductDTO>();
        var seen = new HashSet<int>();

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            var userLines = (await LoadOrderLinesAsync(userEmail)).ToList();
            var boughtIds = userLines
                .Select(l => l.ProductId)
                .Distinct()
                .ToList();

            foreach (var productId in boughtIds.OrderByDescending(id =>
                    userLines.Where(l => l.ProductId == id).Sum(l => l.Quantity))
                .Take(3))
            {
                await TryAddProductByIdAsync(productId, suggestions, seen);
            }

            if (boughtIds.Count > 0)
            {
                var coPurchased = await GetCoPurchasedProductsAsync(
                    boughtIds,
                    boughtIds.Concat(seen).ToHashSet(),
                    count
                );
                foreach (var product in coPurchased)
                {
                    if (seen.Add(product.Id))
                        suggestions.Add(product);
                }
            }

            foreach (var productId in boughtIds.Take(4))
                await AddSimilarForProductAsync(productId, suggestions, seen, 2);
        }

        foreach (var id in (cartProductIds ?? []).Distinct().Take(4))
            await AddSimilarForProductAsync(id, suggestions, seen, 2);

        foreach (var id in (recentlyViewedIds ?? []).Distinct().Take(4))
            await AddSimilarForProductAsync(id, suggestions, seen, 2);

        if (!string.IsNullOrWhiteSpace(userEmail))
        {
            try
            {
                var wishlist = await _wishlistService.GetWishlistAsync(userEmail);
                foreach (var productId in wishlist.ProductIds.Take(3))
                    await AddSimilarForProductAsync(productId, suggestions, seen, 2);
            }
            catch
            {
                // optional
            }
        }

        if (suggestions.Count < count)
        {
            var lines = await LoadOrderLinesAsync();
            foreach (var product in await ResolveProductsByPurchaseVolumeAsync(lines, count, seen))
            {
                if (seen.Add(product.Id))
                    suggestions.Add(product);
                if (suggestions.Count >= count)
                    break;
            }
        }

        if (suggestions.Count < count)
        {
            foreach (var item in await GetReviewTrendingAsync(count))
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
        var anchors = productIds.Distinct().Where(id => id > 0).ToList();
        if (anchors.Count == 0)
            return await GetTrendingAsync(count);

        var suggestions = await GetCoPurchasedProductsAsync(anchors, anchors, count);
        if (suggestions.Count >= count)
            return suggestions.Take(count);

        var list = suggestions.ToList();
        var seen = new HashSet<int>(list.Select(p => p.Id).Concat(anchors));

        foreach (var id in anchors.Take(5))
            await AddSimilarForProductAsync(id, list, seen, 4);

        if (list.Count < count)
        {
            foreach (var item in await GetTrendingAsync(count))
            {
                if (seen.Add(item.Id))
                    list.Add(item);
                if (list.Count >= count)
                    break;
            }
        }

        return list.Take(count);
    }

    public async Task<IEnumerable<ProductDTO>> GetByBudgetAsync(decimal maxPrice, int count = 8)
    {
        var lines = await LoadOrderLinesAsync();
        if (lines.Count > 0)
        {
            var purchased = await ResolveProductsByPurchaseVolumeAsync(lines, count * 3, []);
            var filtered = purchased.Where(p => p.Price <= maxPrice).Take(count).ToList();
            if (filtered.Count > 0)
                return filtered;
        }

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

        var inCategory = filtered.ToList();
        if (inCategory.Count == 0)
            return [];

        var lines = await LoadOrderLinesAsync();
        var categoryIds = inCategory.Select(p => p.Id).ToHashSet();
        var purchaseRank = lines
            .Where(l => categoryIds.Contains(l.ProductId))
            .GroupBy(l => l.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

        if (purchaseRank.Count > 0)
        {
            return inCategory
                .OrderByDescending(p => purchaseRank.GetValueOrDefault(p.Id))
                .ThenByDescending(p => p.ReviewCount > 0 ? p.AverageRating : 0)
                .Take(count);
        }

        return inCategory
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

    private async Task<List<OrderLine>> LoadOrderLinesAsync(string? userEmail = null)
    {
        var spec = string.IsNullOrWhiteSpace(userEmail)
            ? new OrderSpecification()
            : new OrderSpecification(userEmail);

        var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(spec);

        return orders
            .Where(o => !ExcludedOrderStatuses.Contains(o.Status))
            .SelectMany(o =>
                o.Items.Select(i => new OrderLine(o.Id, i.Product.ProductId, i.Quantity))
            )
            .Where(l => l.ProductId > 0)
            .ToList();
    }

    private async Task<List<ProductDTO>> GetCoPurchasedProductsAsync(
        IReadOnlyList<int> anchorProductIds,
        IEnumerable<int> excludeIds,
        int count
    )
    {
        if (anchorProductIds.Count == 0 || count <= 0)
            return [];

        var exclude = excludeIds.ToHashSet();
        var lines = await LoadOrderLinesAsync();
        if (lines.Count == 0)
            return [];

        var anchorSet = anchorProductIds.ToHashSet();
        var orderIdsWithAnchor = lines
            .Where(l => anchorSet.Contains(l.ProductId))
            .Select(l => l.OrderId)
            .ToHashSet();

        if (orderIdsWithAnchor.Count == 0)
            return [];

        var scores = lines
            .Where(l => orderIdsWithAnchor.Contains(l.OrderId))
            .Where(l => !exclude.Contains(l.ProductId))
            .Where(l => !anchorSet.Contains(l.ProductId))
            .GroupBy(l => l.ProductId)
            .Select(g => new { ProductId = g.Key, Score = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.Score)
            .Take(count)
            .ToList();

        return await ResolveProductsByIdsAsync(scores.Select(s => s.ProductId).ToList());
    }

    private async Task<List<ProductDTO>> ResolveProductsByPurchaseVolumeAsync(
        IReadOnlyList<OrderLine> lines,
        int count,
        HashSet<int> exclude
    )
    {
        var rankedIds = lines
            .Where(l => !exclude.Contains(l.ProductId))
            .GroupBy(l => l.ProductId)
            .Select(g => new { ProductId = g.Key, TotalQty = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.TotalQty)
            .Take(count)
            .Select(x => x.ProductId)
            .ToList();

        return await ResolveProductsByIdsAsync(rankedIds);
    }

    private async Task<List<ProductDTO>> ResolveProductsByIdsAsync(IReadOnlyList<int> productIds)
    {
        var products = new List<ProductDTO>();
        foreach (var id in productIds)
        {
            var result = await _productService.GetProductByIdAsync(id);
            if (result.IsSuccess)
                products.Add(result.Value);
        }

        return products;
    }

    private async Task TryAddProductByIdAsync(
        int productId,
        List<ProductDTO> suggestions,
        HashSet<int> seen
    )
    {
        if (!seen.Add(productId))
            return;

        var result = await _productService.GetProductByIdAsync(productId);
        if (result.IsSuccess)
            suggestions.Add(result.Value);
        else
            seen.Remove(productId);
    }

    private async Task<IEnumerable<ProductDTO>> GetReviewTrendingAsync(int count)
    {
        var all = await _productService.GetAllProductsForAdminAsync();
        return all
            .OrderByDescending(p => p.ReviewCount > 0 ? p.AverageRating : 0)
            .ThenByDescending(p => p.ReviewCount)
            .ThenByDescending(p => p.Id)
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

    private sealed record OrderLine(Guid OrderId, int ProductId, int Quantity);
}
