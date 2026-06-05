using System.Text.Json;
using ECommerce.Domain.Entities.AdminModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;

namespace ECommerce.Services;

public sealed class RecommendationTrackingService : IRecommendationTrackingService
{
    private readonly StoreDbContext _db;

    public RecommendationTrackingService(StoreDbContext db)
    {
        _db = db;
    }

    public async Task TrackImpressionAsync(
        string source,
        IEnumerable<int> productIds,
        string? userEmail = null,
        CancellationToken ct = default
    )
    {
        var ids = productIds.Distinct().ToList();
        if (ids.Count == 0)
            return;

        _db.RecommendationEvents.Add(new RecommendationEvent
        {
            Source = source,
            EventType = "impression",
            ProductIdsJson = JsonSerializer.Serialize(ids),
            UserEmail = userEmail,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task TrackClickAsync(
        string source,
        int productId,
        string? userEmail = null,
        CancellationToken ct = default
    )
    {
        _db.RecommendationEvents.Add(new RecommendationEvent
        {
            Source = source,
            EventType = "click",
            ProductIdsJson = JsonSerializer.Serialize(new[] { productId }),
            ClickedProductId = productId,
            UserEmail = userEmail,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }
}
