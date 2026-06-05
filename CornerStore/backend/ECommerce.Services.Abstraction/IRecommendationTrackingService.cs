namespace ECommerce.Services.Abstraction;

public interface IRecommendationTrackingService
{
    Task TrackImpressionAsync(
        string source,
        IEnumerable<int> productIds,
        string? userEmail = null,
        CancellationToken ct = default
    );

    Task TrackClickAsync(
        string source,
        int productId,
        string? userEmail = null,
        CancellationToken ct = default
    );
}
