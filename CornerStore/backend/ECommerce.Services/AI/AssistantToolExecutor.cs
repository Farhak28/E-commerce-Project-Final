using System.Text.Json;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;
using Microsoft.Extensions.Logging;

namespace ECommerce.Services.AI;

public sealed class AssistantToolExecutor : IAssistantToolExecutor
{
    private readonly IProductService _products;
    private readonly IRecommendationService _recommendations;
    private readonly IOrderService _orders;
    private readonly IRagService _rag;
    private readonly IReviewSummaryService _reviewSummary;
    private readonly ILogger<AssistantToolExecutor> _logger;

    public AssistantToolExecutor(
        IProductService products,
        IRecommendationService recommendations,
        IOrderService orders,
        IRagService rag,
        IReviewSummaryService reviewSummary,
        ILogger<AssistantToolExecutor> logger
    )
    {
        _products = products;
        _recommendations = recommendations;
        _orders = orders;
        _rag = rag;
        _reviewSummary = reviewSummary;
        _logger = logger;
    }

    public async Task<string> ExecuteAsync(
        string toolName,
        string argumentsJson,
        string? userEmail,
        AssistantContextDTO context,
        CancellationToken ct = default
    )
    {
        _logger.LogInformation("Tool call {Tool} args {Args}", toolName, argumentsJson);
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(argumentsJson) ? "{}" : argumentsJson);
            var root = doc.RootElement;

            return toolName switch
            {
                "searchProducts" => await SearchProducts(root, ct),
                "recommendProducts" => await RecommendProducts(root, userEmail, context, ct),
                "compareProducts" => await CompareProducts(root, context, ct),
                "getSimilarProducts" => await SimilarProducts(root, ct),
                "getOrderStatus" => await OrderStatus(root, userEmail, ct),
                "getTrendingProducts" => await Trending(root, ct),
                "getPersonalizedRecommendations" => await Personalized(userEmail, context, ct),
                "getStorePolicies" => await StorePolicies(root, ct),
                "getProductCategories" => await ProductCategories(ct),
                "getReviewSummary" => await ReviewSummary(root, ct),
                _ => JsonSerializer.Serialize(new { error = $"Unknown tool: {toolName}" }),
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Tool {Tool} failed", toolName);
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    private async Task<string> SearchProducts(JsonElement root, CancellationToken ct)
    {
        var query = root.TryGetProperty("keyword", out var kw)
            ? kw.GetString() ?? ""
            : root.TryGetProperty("query", out var q)
                ? q.GetString() ?? ""
                : "";
        var category = root.TryGetProperty("category", out var cat) ? cat.GetString() : null;
        var brand = root.TryGetProperty("brand", out var br) ? br.GetString() : null;
        var minPrice = root.TryGetProperty("minPrice", out var minP) && minP.TryGetDecimal(out var minVal)
            ? minVal
            : (decimal?)null;
        var maxPrice = root.TryGetProperty("maxPrice", out var mp) && mp.TryGetDecimal(out var price)
            ? price
            : (decimal?)null;

        int? typeId = null;
        int? brandId = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            var types = await _products.GetAllTypesAsync();
            typeId = types.FirstOrDefault(t =>
                t.Name.Equals(category, StringComparison.OrdinalIgnoreCase))?.Id;
        }
        if (!string.IsNullOrWhiteSpace(brand))
        {
            var brands = await _products.GetAllBrandsAsync();
            brandId = brands.FirstOrDefault(b =>
                b.Name.Equals(brand, StringComparison.OrdinalIgnoreCase))?.Id;
        }

        var page = await _products.GetAllProductsAsync(
            new ProductQueryParams
            {
                search = query,
                typeId = typeId,
                brandId = brandId,
                PageIndex = 1,
                PageSize = 20,
            }
        );
        var items = page.Data.AsEnumerable();
        if (minPrice.HasValue)
            items = items.Where(p => p.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            items = items.Where(p => p.Price <= maxPrice.Value);
        return SerializeProducts(items.Take(8).ToList());
    }

    private async Task<string> RecommendProducts(
        JsonElement root,
        string? email,
        AssistantContextDTO ctx,
        CancellationToken ct
    )
    {
        var category = root.TryGetProperty("category", out var c) ? c.GetString() : null;
        var maxPrice = root.TryGetProperty("maxPrice", out var mp) && mp.TryGetDecimal(out var price) ? price : (decimal?)null;
        IEnumerable<ProductDTO> items;
        if (maxPrice.HasValue)
            items = await _recommendations.GetByBudgetAsync(maxPrice.Value, 8);
        else if (!string.IsNullOrWhiteSpace(category))
            items = await _recommendations.GetByCategoryAsync(category!, 8);
        else
            items = await _recommendations.GetPersonalizedAsync(
                email,
                8,
                ctx.CartProductIds,
                ctx.RecentProductIds
            );
        return SerializeProducts(items.ToList());
    }

    private async Task<string> CompareProducts(JsonElement root, AssistantContextDTO ctx, CancellationToken ct)
    {
        var ids = ParseIds(root, "productIds");
        if (ids.Count == 0 && ctx.CompareIds?.Count > 0)
            ids = ctx.CompareIds.ToList();
        if (ids.Count == 0)
            return JsonSerializer.Serialize(new { error = "Provide 2-4 product IDs to compare." });

        var products = new List<object>();
        foreach (var id in ids.Take(4))
        {
            var result = await _products.GetProductByIdAsync(id);
            if (!result.IsSuccess) continue;
            var p = result.Value;
            products.Add(new
            {
                p.Id,
                p.Name,
                p.PictureUrl,
                p.Price,
                p.ProductType,
                p.ProductBrand,
                p.AverageRating,
                p.ReviewCount,
                p.StockQuantity,
                p.Description,
            });
        }
        return JsonSerializer.Serialize(new { products });
    }

    private async Task<string> SimilarProducts(JsonElement root, CancellationToken ct)
    {
        if (!root.TryGetProperty("productId", out var idEl) || !idEl.TryGetInt32(out var productId))
            return JsonSerializer.Serialize(new { error = "productId required" });
        var count = root.TryGetProperty("count", out var c) && c.TryGetInt32(out var n) ? n : 6;
        var items = await _recommendations.GetSimilarAsync(productId, count);
        return SerializeProducts(items.ToList());
    }

    private async Task<string> OrderStatus(JsonElement root, string? email, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email))
            return JsonSerializer.Serialize(new { error = "Sign in to view order status." });

        var ordersResult = await _orders.GetAllOrdersAsync(email);
        if (!ordersResult.IsSuccess)
            return JsonSerializer.Serialize(new { error = "Could not load orders." });

        var orders = ordersResult.Value.ToList();
        if (root.TryGetProperty("orderId", out var oid))
        {
            var search = oid.GetString() ?? "";
            var match = orders.FirstOrDefault(o => o.Id.ToString().Contains(search, StringComparison.OrdinalIgnoreCase));
            if (match is null)
                return JsonSerializer.Serialize(new { error = "Order not found." });
            return JsonSerializer.Serialize(new
            {
                order = new
                {
                    match.Id,
                    match.Status,
                    match.Total,
                    match.OrderDate,
                },
            });
        }

        return JsonSerializer.Serialize(new
        {
            orders = orders.Take(5).Select(o => new { o.Id, o.Status, o.Total, o.OrderDate }),
        });
    }

    private async Task<string> Trending(JsonElement root, CancellationToken ct)
    {
        var count = root.TryGetProperty("count", out var c) && c.TryGetInt32(out var n) ? n : 8;
        var items = await _recommendations.GetTrendingAsync(count);
        return SerializeProducts(items.ToList());
    }

    private async Task<string> Personalized(string? email, AssistantContextDTO ctx, CancellationToken ct)
    {
        var items = await _recommendations.GetPersonalizedAsync(
            email,
            8,
            ctx.CartProductIds,
            ctx.RecentProductIds
        );
        return SerializeProducts(items.ToList());
    }

    private async Task<string> StorePolicies(JsonElement root, CancellationToken ct)
    {
        var topic = root.TryGetProperty("topic", out var t) ? t.GetString() ?? "" : "";
        var query = string.IsNullOrWhiteSpace(topic) ? "store policies FAQ shipping returns payment warranty" : topic;
        var chunks = await _rag.RetrieveAsync(query, 5, ct);
        return JsonSerializer.Serialize(new
        {
            policies = chunks.Select(c => new { c.Title, c.Category, c.Text }),
        });
    }

    private async Task<string> ProductCategories(CancellationToken ct)
    {
        var types = await _products.GetAllTypesAsync();
        return JsonSerializer.Serialize(new
        {
            categories = types.Select(t => new { t.Id, t.Name }),
        });
    }

    private async Task<string> ReviewSummary(JsonElement root, CancellationToken ct)
    {
        if (!root.TryGetProperty("productId", out var idEl) || !idEl.TryGetInt32(out var productId))
            return JsonSerializer.Serialize(new { error = "productId required" });

        var summary = await _reviewSummary.GetSummaryAsync(productId, ct);
        if (summary is null)
            return JsonSerializer.Serialize(new { error = "Product not found." });

        return JsonSerializer.Serialize(new { reviewSummary = summary });
    }

    private static string SerializeProducts(IReadOnlyList<ProductDTO> products) =>
        JsonSerializer.Serialize(new { products });

    private static List<int> ParseIds(JsonElement root, string prop)
    {
        var ids = new List<int>();
        if (!root.TryGetProperty(prop, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return ids;
        foreach (var el in arr.EnumerateArray())
            if (el.TryGetInt32(out var id)) ids.Add(id);
        return ids;
    }
}

public static class AssistantToolCatalog
{
    public static IReadOnlyList<AiToolDefinition> All { get; } =
    [
        new("searchProducts", "Search the product catalog by keyword, category, brand, and price range (USD).", """{"type":"object","properties":{"keyword":{"type":"string"},"query":{"type":"string"},"category":{"type":"string"},"brand":{"type":"string"},"minPrice":{"type":"number"},"maxPrice":{"type":"number"}}}"""),
        new("recommendProducts", "Recommend products by category, budget, or personalization.", """{"type":"object","properties":{"category":{"type":"string"},"maxPrice":{"type":"number"}}}"""),
        new("compareProducts", "Compare 2-4 products by ID. Use compare list from context when available.", """{"type":"object","properties":{"productIds":{"type":"array","items":{"type":"integer"}}}}"""),
        new("getSimilarProducts", "Find products similar to a given product ID.", """{"type":"object","properties":{"productId":{"type":"integer"},"count":{"type":"integer"}},"required":["productId"]}"""),
        new("getOrderStatus", "Get order status for the signed-in user. Optional orderId substring.", """{"type":"object","properties":{"orderId":{"type":"string"}}}"""),
        new("getTrendingProducts", "Get trending/popular products.", """{"type":"object","properties":{"count":{"type":"integer"}}}"""),
        new("getPersonalizedRecommendations", "Personalized picks using cart, browsing, wishlist, and orders.", """{"type":"object","properties":{}}"""),
        new("getStorePolicies", "Retrieve store policies, FAQ, shipping, returns, warranty, payment info.", """{"type":"object","properties":{"topic":{"type":"string"}}}"""),
        new("getProductCategories", "List all product categories/types in the catalog.", """{"type":"object","properties":{}}"""),
        new("getReviewSummary", "Analyze customer reviews for a product. Returns sentiment breakdown and summary.", """{"type":"object","properties":{"productId":{"type":"integer"}},"required":["productId"]}"""),
    ];
}
