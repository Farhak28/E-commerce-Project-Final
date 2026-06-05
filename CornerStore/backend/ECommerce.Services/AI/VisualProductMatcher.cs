using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;

namespace ECommerce.Services.AI;

public sealed class VisualProductMatcher
{
    private static readonly Dictionary<string, string[]> CategoryAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Smartphones"] = ["smartphones", "smartphone", "phone", "phones", "mobile", "android", "iphone"],
        ["Gaming"] = ["gaming", "gamer", "console", "games", "playstation", "xbox", "nintendo"],
        ["Laptops"] = ["laptops", "laptop", "notebook", "macbook", "macbooks", "computer"],
        ["Audio"] = ["audio", "headphone", "headphones", "earbud", "earbuds", "speaker", "speakers", "headset"],
        ["Accessories"] = ["accessories", "accessory", "case", "charger", "cable"],
        ["Smart Watches"] = ["smart watches", "smartwatch", "wearable", "watch", "watches", "fitness band"],
    };

    public VisualMatchResult Match(
        IReadOnlyList<ProductDTO> catalog,
        VisualProductAttributesDTO attributes,
        int maxResults = 8
    )
    {
        var scored = catalog
            .Select(p => (Product: p, Score: ScoreProduct(p, attributes), Tier: ""))
            .Where(x => x.Score >= 25)
            .OrderByDescending(x => x.Score)
            .Select(x => (
                x.Product,
                x.Score,
                Tier: x.Score >= 85 ? "exact" : x.Score >= 55 ? "similar" : "alternative"
            ))
            .ToList();

        var exact = scored
            .Where(x => x.Tier == "exact")
            .Take(maxResults)
            .Select(x => ToMatch(x.Product, x.Score, x.Tier))
            .ToList();

        var similar = scored
            .Where(x => x.Tier == "similar")
            .Take(maxResults)
            .Select(x => ToMatch(x.Product, x.Score, x.Tier))
            .ToList();

        var alternatives = scored
            .Where(x => x.Tier == "alternative")
            .Take(maxResults)
            .Select(x => ToMatch(x.Product, x.Score, x.Tier))
            .ToList();

        if (exact.Count == 0 && similar.Count == 0 && alternatives.Count == 0)
        {
            alternatives = catalog
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewCount)
                .Take(Math.Min(6, maxResults))
                .Select(p => ToMatch(p, 30, "alternative"))
                .ToList();
        }

        return new VisualMatchResult(exact, similar, alternatives);
    }

    private static int ScoreProduct(ProductDTO product, VisualProductAttributesDTO attrs)
    {
        var score = 0;
        var haystack = $"{product.Name} {product.Description} {product.ProductType} {product.ProductBrand}"
            .ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(attrs.ProductName))
        {
            var name = attrs.ProductName.Trim();
            if (product.Name.Contains(name, StringComparison.OrdinalIgnoreCase)
                || name.Contains(product.Name, StringComparison.OrdinalIgnoreCase))
            {
                score = Math.Max(score, 92);
            }
            else
            {
                var nameTokens = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var tokenHits = nameTokens.Count(t => t.Length > 2 && haystack.Contains(t.ToLowerInvariant()));
                if (tokenHits >= 2)
                    score = Math.Max(score, 75 + tokenHits * 3);
            }
        }

        if (!string.IsNullOrWhiteSpace(attrs.Brand)
            && product.ProductBrand.Contains(attrs.Brand, StringComparison.OrdinalIgnoreCase))
        {
            score += 25;
        }

        var category = ResolveCategory(attrs.Category, attrs.ProductType);
        if (!string.IsNullOrWhiteSpace(category)
            && product.ProductType.Contains(category, StringComparison.OrdinalIgnoreCase))
        {
            score += 30;
        }

        foreach (var keyword in attrs.Keywords.Concat(attrs.Features))
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Length < 3) continue;
            if (haystack.Contains(keyword.ToLowerInvariant()))
                score += 5;
        }

        if (!string.IsNullOrWhiteSpace(attrs.Color) && haystack.Contains(attrs.Color.ToLowerInvariant()))
            score += 8;

        if (!string.IsNullOrWhiteSpace(attrs.Material) && haystack.Contains(attrs.Material.ToLowerInvariant()))
            score += 6;

        if (!string.IsNullOrWhiteSpace(attrs.Style) && haystack.Contains(attrs.Style.ToLowerInvariant()))
            score += 4;

        return Math.Min(100, score);
    }

    private static string? ResolveCategory(string? category, string? productType)
    {
        var candidate = category ?? productType;
        if (string.IsNullOrWhiteSpace(candidate)) return null;

        foreach (var (canonical, aliases) in CategoryAliases)
        {
            if (canonical.Equals(candidate, StringComparison.OrdinalIgnoreCase)
                || aliases.Any(a => candidate.Contains(a, StringComparison.OrdinalIgnoreCase)))
            {
                return canonical;
            }
        }

        return candidate;
    }

    private static VisualProductMatchDTO ToMatch(ProductDTO product, int score, string tier) =>
        new(product, score, tier);
}

public sealed record VisualMatchResult(
    IReadOnlyList<VisualProductMatchDTO> ExactMatches,
    IReadOnlyList<VisualProductMatchDTO> SimilarProducts,
    IReadOnlyList<VisualProductMatchDTO> Alternatives
);
