using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.ProductDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

public class RecommendationsController : ApiBaseController
{
    private readonly IRecommendationService _recommendationService;
    private readonly IRecommendationTrackingService _tracking;

    public RecommendationsController(
        IRecommendationService recommendationService,
        IRecommendationTrackingService tracking
    )
    {
        _recommendationService = recommendationService;
        _tracking = tracking;
    }

    [HttpGet("trending")]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetTrending([FromQuery] int count = 8)
    {
        var products = (await _recommendationService.GetTrendingAsync(count)).ToList();
        await _tracking.TrackImpressionAsync("trending", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("similar/{productId:int}")]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetSimilar(int productId, [FromQuery] int count = 5)
    {
        var products = (await _recommendationService.GetSimilarAsync(productId, count)).ToList();
        await _tracking.TrackImpressionAsync("similar", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("bought-together/{productId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetBoughtTogether(
        int productId,
        [FromQuery] int count = 6
    )
    {
        var products = (await _recommendationService.GetBoughtTogetherAsync(productId, count)).ToList();
        await _tracking.TrackImpressionAsync("bought-together", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("personalized")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetPersonalized(
        [FromQuery] int count = 8,
        [FromQuery] string? cartIds = null,
        [FromQuery] string? recentIds = null
    )
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var products = (await _recommendationService.GetPersonalizedAsync(
            email,
            count,
            ParseIds(cartIds),
            ParseIds(recentIds)
        )).ToList();
        await _tracking.TrackImpressionAsync("personalized", products.Select(p => p.Id), email);
        return Ok(products);
    }

    [HttpGet("personalized/guest")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetPersonalizedGuest(
        [FromQuery] int count = 8,
        [FromQuery] string? cartIds = null,
        [FromQuery] string? recentIds = null
    )
    {
        var products = (await _recommendationService.GetPersonalizedAsync(
            null,
            count,
            ParseIds(cartIds),
            ParseIds(recentIds)
        )).ToList();
        await _tracking.TrackImpressionAsync("personalized-guest", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("for-products")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetForProducts(
        [FromQuery] string productIds,
        [FromQuery] int count = 8
    )
    {
        var ids = ParseIds(productIds);
        if (ids.Count == 0)
            return Ok(Array.Empty<ProductDTO>());

        var products = (await _recommendationService.GetForProductIdsAsync(ids, count)).ToList();
        await _tracking.TrackImpressionAsync("for-products", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("by-budget")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetByBudget(
        [FromQuery] decimal maxPrice,
        [FromQuery] int count = 8
    )
    {
        var products = (await _recommendationService.GetByBudgetAsync(maxPrice, count)).ToList();
        await _tracking.TrackImpressionAsync("by-budget", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("by-category")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetByCategory(
        [FromQuery] string category,
        [FromQuery] int count = 8
    )
    {
        var products = (await _recommendationService.GetByCategoryAsync(category, count)).ToList();
        await _tracking.TrackImpressionAsync("by-category", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpGet("similar-price/{productId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ProductDTO>>> GetSimilarPrice(
        int productId,
        [FromQuery] int count = 6
    )
    {
        var products = (await _recommendationService.GetByPriceProximityAsync(productId, count)).ToList();
        await _tracking.TrackImpressionAsync("similar-price", products.Select(p => p.Id));
        return Ok(products);
    }

    [HttpPost("track-click")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackClick(
        [FromBody] TrackRecommendationClickDTO dto,
        CancellationToken ct
    )
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        await _tracking.TrackClickAsync(dto.Source, dto.ProductId, email, ct);
        return NoContent();
    }

    private static List<int> ParseIds(string? raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? []
            : raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var id) ? id : 0)
                .Where(id => id > 0)
                .Distinct()
                .ToList();
}

public record TrackRecommendationClickDTO(string Source, int ProductId);
