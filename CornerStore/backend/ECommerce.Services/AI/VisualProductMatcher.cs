using System.Text.RegularExpressions;
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

    private static readonly Regex IPhoneModelRegex = new(
        @"iphone\s*(\d+)\s*(pro\s*max|pro|plus|mini|max)?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public VisualMatchResult Match(
        IReadOnlyList<ProductDTO> catalog,
        VisualProductAttributesDTO attributes,
        int maxResults = 8
    )
    {
        if (!string.IsNullOrWhiteSpace(attributes.CatalogMatchName))
        {
            var catalogHit = catalog.FirstOrDefault(p =>
                p.Name.Equals(attributes.CatalogMatchName, StringComparison.OrdinalIgnoreCase)
                || p.Name.Contains(attributes.CatalogMatchName, StringComparison.OrdinalIgnoreCase));
            if (catalogHit is not null)
            {
                var exact = new List<VisualProductMatchDTO> { ToMatch(catalogHit, 95, "exact") };
                var others = catalog
                    .Where(p => p.Id != catalogHit.Id)
                    .Select(p => (Product: p, Score: ScoreProduct(p, attributes), Tier: ""))
                    .Where(x => x.Score >= 40)
                    .OrderByDescending(x => x.Score)
                    .Take(maxResults - 1)
                    .Select(x => ToMatch(x.Product, x.Score, x.Score >= 55 ? "similar" : "alternative"))
                    .ToList();
                return new VisualMatchResult(exact, others.Where(m => m.MatchTier == "similar").ToList(), others.Where(m => m.MatchTier == "alternative").ToList());
            }
        }

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

        var exactMatches = scored
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

        if (exactMatches.Count == 0 && similar.Count == 0 && alternatives.Count == 0)
        {
            alternatives = catalog
                .OrderByDescending(p => p.AverageRating)
                .ThenByDescending(p => p.ReviewCount)
                .Take(Math.Min(6, maxResults))
                .Select(p => ToMatch(p, 30, "alternative"))
                .ToList();
        }

        return new VisualMatchResult(exactMatches, similar, alternatives);
    }

    private static int ScoreProduct(ProductDTO product, VisualProductAttributesDTO attrs)
    {
        var score = 0;
        var haystack = $"{product.Name} {product.Description} {product.ProductType} {product.ProductBrand}"
            .ToLowerInvariant();

        var detectedLabel = attrs.ProductName ?? attrs.ModelLine ?? "";
        if (!string.IsNullOrWhiteSpace(detectedLabel))
        {
            var name = detectedLabel.Trim();
            if (product.Name.Equals(name, StringComparison.OrdinalIgnoreCase)
                || product.Name.Contains(name, StringComparison.OrdinalIgnoreCase)
                || name.Contains(product.Name, StringComparison.OrdinalIgnoreCase))
            {
                score = Math.Max(score, 95);
            }
            else
            {
                var nameTokens = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var tokenHits = nameTokens.Count(t => t.Length > 2 && haystack.Contains(t.ToLowerInvariant()));
                if (tokenHits >= 2)
                    score = Math.Max(score, 70 + tokenHits * 3);
            }
        }

        score += ScorePhoneGeneration(product.Name, attrs);

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

        if (!string.IsNullOrWhiteSpace(attrs.ModelLine)
            && haystack.Contains(attrs.ModelLine.Replace(" ", "").ToLowerInvariant()))
        {
            score += 15;
        }

        if (!string.IsNullOrWhiteSpace(attrs.Color) && haystack.Contains(attrs.Color.ToLowerInvariant()))
            score += 8;

        if (!string.IsNullOrWhiteSpace(attrs.Material) && haystack.Contains(attrs.Material.ToLowerInvariant()))
            score += 6;

        if (!string.IsNullOrWhiteSpace(attrs.Style) && haystack.Contains(attrs.Style.ToLowerInvariant()))
            score += 4;

        return Math.Min(100, Math.Max(0, score));
    }

    private static int ScorePhoneGeneration(string productName, VisualProductAttributesDTO attrs)
    {
        var detectedKey = NormalizeIPhoneModel(attrs.ModelLine ?? attrs.ProductName);
        var productKey = NormalizeIPhoneModel(productName);
        if (detectedKey is null || productKey is null)
            return 0;

        if (detectedKey == productKey)
            return 25;

        var detectedGen = ExtractIPhoneGeneration(detectedKey);
        var productGen = ExtractIPhoneGeneration(productKey);
        if (detectedGen is null || productGen is null)
            return 0;

        var gap = Math.Abs(detectedGen.Value - productGen.Value);
        return gap switch
        {
            0 => 20,
            1 => 4,
            _ => -30,
        };
    }

    private static string? NormalizeIPhoneModel(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        var match = IPhoneModelRegex.Match(text);
        if (!match.Success)
            return null;

        var generation = match.Groups[1].Value;
        var variant = match.Groups[2].Success
            ? match.Groups[2].Value.Replace(" ", "", StringComparison.Ordinal).ToLowerInvariant()
            : "";
        return string.IsNullOrEmpty(variant) ? $"iphone-{generation}" : $"iphone-{generation}-{variant}";
    }

    private static int? ExtractIPhoneGeneration(string normalizedKey)
    {
        var parts = normalizedKey.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length >= 2 && int.TryParse(parts[1], out var gen) ? gen : null;
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
