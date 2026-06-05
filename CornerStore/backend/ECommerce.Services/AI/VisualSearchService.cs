using System.Diagnostics;
using System.Text.Json;
using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public sealed class VisualSearchService : IVisualSearchService
{
    private const int MaxImageBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    };

    private const string VisionPrompt = """
        Analyze this product image for an e-commerce catalog search.
        Rules:
        - Only identify products and product attributes.
        - Never identify people.
        - Never infer sensitive personal information.
        Return JSON only with fields:
        category, productType, brand, color, material, style, productName,
        features (string array), keywords (string array), confidence (0-1 number).
        Use null for unknown string fields. keywords should include 3-8 search terms.
        """;

    private readonly IAIProvider _ai;
    private readonly IProductService _products;
    private readonly StoreDbContext _db;
    private readonly VisualProductMatcher _matcher;
    private readonly AiOptions _options;
    private readonly ILogger<VisualSearchService> _logger;

    public VisualSearchService(
        IAIProvider ai,
        IProductService products,
        StoreDbContext db,
        IOptions<AiOptions> options,
        ILogger<VisualSearchService> logger
    )
    {
        _ai = ai;
        _products = products;
        _db = db;
        _matcher = new VisualProductMatcher();
        _options = options.Value;
        _logger = logger;
    }

    public async Task<VisualSearchResponseDTO> SearchAsync(
        VisualSearchRequestDTO request,
        string? userEmail,
        CancellationToken ct = default
    )
    {
        if (!_ai.IsConfigured)
        {
            return EmptyResponse(
                "Visual search requires GEMINI_API_KEY. Configure the API server and try again.",
                DefaultAttributes()
            );
        }

        ValidateImage(request);

        var sw = Stopwatch.StartNew();
        VisualProductAttributesDTO attributes;

        try
        {
            var json = await _ai.AnalyzeImageAsync(request.ImageBase64, request.MimeType, VisionPrompt, ct);
            attributes = ParseAttributes(json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini vision analysis failed");
            return EmptyResponse(
                "I could not analyze that image. Try a clearer photo with the product centered and well lit.",
                DefaultAttributes()
            );
        }

        var catalog = (await _products.GetAllProductsForAdminAsync()).ToList();
        var matchResult = _matcher.Match(catalog, attributes);

        var exactFound = matchResult.ExactMatches.Count > 0;
        var text = BuildResponseText(attributes, exactFound, matchResult);

        sw.Stop();
        await LogEventAsync(request, userEmail, attributes, exactFound, matchResult, (int)sw.ElapsedMilliseconds, ct);

        return new VisualSearchResponseDTO(
            text,
            exactFound,
            attributes,
            matchResult.ExactMatches,
            matchResult.SimilarProducts,
            matchResult.Alternatives,
            request.SessionId
        );
    }

    private static void ValidateImage(VisualSearchRequestDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.ImageBase64))
            throw new ArgumentException("Image data is required.");

        if (!AllowedMimeTypes.Contains(request.MimeType.Trim()))
            throw new ArgumentException("Unsupported image format. Use JPG, PNG, or WEBP.");

        try
        {
            var bytes = Convert.FromBase64String(request.ImageBase64);
            if (bytes.Length > MaxImageBytes)
                throw new ArgumentException("Image exceeds the 10 MB limit.");
        }
        catch (FormatException)
        {
            throw new ArgumentException("Invalid image data.");
        }
    }

    private static VisualProductAttributesDTO ParseAttributes(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            return new VisualProductAttributesDTO(
                Category: GetString(root, "category"),
                ProductType: GetString(root, "productType"),
                Brand: GetString(root, "brand"),
                Color: GetString(root, "color"),
                Material: GetString(root, "material"),
                Style: GetString(root, "style"),
                ProductName: GetString(root, "productName"),
                Features: GetStringArray(root, "features"),
                Keywords: GetStringArray(root, "keywords"),
                Confidence: root.TryGetProperty("confidence", out var c) && c.TryGetDouble(out var conf)
                    ? conf
                    : 0.5
            );
        }
        catch
        {
            return DefaultAttributes();
        }
    }

    private static VisualProductAttributesDTO DefaultAttributes() =>
        new(null, null, null, null, null, null, null, Array.Empty<string>(), Array.Empty<string>(), 0);

    private static string? GetString(JsonElement root, string name) =>
        root.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.String
            ? el.GetString()
            : null;

    private static IReadOnlyList<string> GetStringArray(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var el) || el.ValueKind != JsonValueKind.Array)
            return Array.Empty<string>();

        return el.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString() ?? "")
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();
    }

    private static string BuildResponseText(
        VisualProductAttributesDTO attrs,
        bool exactFound,
        VisualMatchResult matches
    )
    {
        var label = attrs.ProductName
            ?? attrs.Brand
            ?? attrs.Category
            ?? "this product";

        if (exactFound)
        {
            var top = matches.ExactMatches[0];
            return $"This appears to be {label}. We found a strong match: **{top.Product.Name}** (${top.Product.Price}, {top.MatchPercentage}% match).";
        }

        var similarCount = matches.SimilarProducts.Count + matches.Alternatives.Count;
        if (similarCount > 0)
        {
            return $"We do not currently sell this exact product ({label}). However, these {similarCount} catalog items are very similar.";
        }

        return "I could not find close matches in our catalog. Try another angle or search by product name.";
    }

    private async Task LogEventAsync(
        VisualSearchRequestDTO request,
        string? userEmail,
        VisualProductAttributesDTO attributes,
        bool exactFound,
        VisualMatchResult matches,
        int latencyMs,
        CancellationToken ct
    )
    {
        var matchCount = matches.ExactMatches.Count + matches.SimilarProducts.Count + matches.Alternatives.Count;
        _db.VisualSearchEvents.Add(new VisualSearchEvent
        {
            SessionId = request.SessionId,
            UserEmail = userEmail,
            DetectedCategory = attributes.Category ?? attributes.ProductType ?? "Unknown",
            DetectedBrand = attributes.Brand,
            ExactMatchFound = exactFound,
            MatchCount = matchCount,
            AttributesJson = JsonSerializer.Serialize(attributes),
            LatencyMs = latencyMs,
        });
        await _db.SaveChangesAsync(ct);
    }

    private static VisualSearchResponseDTO EmptyResponse(string text, VisualProductAttributesDTO attrs) =>
        new(text, false, attrs, Array.Empty<VisualProductMatchDTO>(), Array.Empty<VisualProductMatchDTO>(), Array.Empty<VisualProductMatchDTO>());
}
