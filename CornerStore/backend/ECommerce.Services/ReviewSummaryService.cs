using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared.DTOs.ReviewDTOs;

namespace ECommerce.Services;

public sealed class ReviewSummaryService : IReviewSummaryService
{
    private static readonly string[] PositiveWords =
        ["good", "great", "excellent", "amazing", "perfect", "fast", "useful"];

    private static readonly string[] NegativeWords =
        ["bad", "poor", "slow", "broken", "terrible", "weak", "expensive"];

    private static readonly Dictionary<string, string> ThemeLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["battery"] = "battery life",
        ["display"] = "display quality",
        ["screen"] = "display quality",
        ["camera"] = "camera quality",
        ["sound"] = "sound quality",
        ["audio"] = "sound quality",
        ["charging"] = "charging speed",
        ["charge"] = "charging speed",
        ["build"] = "build quality",
        ["quality"] = "build quality",
        ["price"] = "value for money",
        ["value"] = "value for money",
        ["comfort"] = "comfort",
        ["design"] = "design",
        ["performance"] = "performance",
        ["speed"] = "performance",
    };

    private readonly IProductService _products;

    public ReviewSummaryService(IProductService products)
    {
        _products = products;
    }

    public async Task<ReviewSummaryDTO?> GetSummaryAsync(int productId, CancellationToken ct = default)
    {
        var productResult = await _products.GetProductByIdAsync(productId);
        if (!productResult.IsSuccess)
            return null;

        var product = productResult.Value;
        var reviews = (await _products.GetReviewsByProductIdAsync(productId)).ToList();
        if (reviews.Count == 0)
        {
            return new ReviewSummaryDTO(
                productId,
                product.Name,
                product.AverageRating,
                0,
                0,
                0,
                0,
                Array.Empty<string>(),
                Array.Empty<string>(),
                $"No written reviews yet for {product.Name}. Average catalog rating is {product.AverageRating:F1}/5."
            );
        }

        var sentiments = reviews
            .Select(r => ClassifySentiment(r.Comment, r.Rating))
            .ToList();

        var positiveCount = sentiments.Count(s => s == Sentiment.Positive);
        var negativeCount = sentiments.Count(s => s == Sentiment.Negative);
        var neutralCount = sentiments.Count - positiveCount - negativeCount;
        var total = reviews.Count;

        var positiveComments = reviews
            .Where((_, i) => sentiments[i] == Sentiment.Positive)
            .Select(r => r.Comment);
        var negativeComments = reviews
            .Where((_, i) => sentiments[i] == Sentiment.Negative)
            .Select(r => r.Comment);
        var positiveThemes = ExtractThemes(positiveComments);
        var negativeThemes = ExtractThemes(negativeComments);

        var avgRating = reviews.Average(r => r.Rating);
        var summary = BuildSummary(product.Name, positiveThemes, negativeThemes, positiveCount, negativeCount, total);

        return new ReviewSummaryDTO(
            productId,
            product.Name,
            Math.Round(avgRating, 1),
            total,
            Math.Round(positiveCount * 100.0 / total, 1),
            Math.Round(neutralCount * 100.0 / total, 1),
            Math.Round(negativeCount * 100.0 / total, 1),
            positiveThemes,
            negativeThemes,
            summary
        );
    }

    private enum Sentiment
    {
        Positive,
        Neutral,
        Negative,
    }

    private static Sentiment ClassifySentiment(string comment, int rating)
    {
        var lower = comment.ToLowerInvariant();
        var positiveHits = PositiveWords.Count(w => lower.Contains(w, StringComparison.Ordinal));
        var negativeHits = NegativeWords.Count(w => lower.Contains(w, StringComparison.Ordinal));

        if (positiveHits > negativeHits || (positiveHits == negativeHits && rating >= 4))
            return Sentiment.Positive;
        if (negativeHits > positiveHits || (positiveHits == negativeHits && rating <= 2))
            return Sentiment.Negative;
        return Sentiment.Neutral;
    }

    private static IReadOnlyList<string> ExtractThemes(IEnumerable<string> comments)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var comment in comments)
        {
            var lower = comment.ToLowerInvariant();
            foreach (var (keyword, label) in ThemeLabels)
            {
                if (lower.Contains(keyword, StringComparison.Ordinal))
                    counts[label] = counts.GetValueOrDefault(label) + 1;
            }
        }

        return counts
            .OrderByDescending(kv => kv.Value)
            .Take(3)
            .Select(kv => kv.Key)
            .ToList();
    }

    private static string BuildSummary(
        string productName,
        IReadOnlyList<string> positiveThemes,
        IReadOnlyList<string> negativeThemes,
        int positiveCount,
        int negativeCount,
        int total
    )
    {
        if (positiveCount == 0 && negativeCount == 0)
            return $"Reviews for {productName} are mostly neutral across {total} comments.";

        var parts = new List<string>();

        if (positiveThemes.Count > 0)
            parts.Add($"Customers love the {string.Join(" and ", positiveThemes)}");

        if (negativeThemes.Count > 0)
        {
            var negativePhrase = negativeThemes.Count == 1
                ? $"frequently mention {negativeThemes[0]}"
                : $"often mention {string.Join(" and ", negativeThemes)}";
            parts.Add(parts.Count > 0 ? $"but {negativePhrase}" : $"Customers {negativePhrase}");
        }
        else if (positiveCount > negativeCount)
        {
            parts.Add("with few recurring complaints");
        }

        var body = parts.Count > 0 ? string.Join(", ", parts) + "." : $"{productName} has mixed feedback.";
        return $"{body} Based on {total} reviews.";
    }
}
