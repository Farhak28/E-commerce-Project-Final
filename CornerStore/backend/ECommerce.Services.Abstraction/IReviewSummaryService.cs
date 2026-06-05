using ECommerce.Shared.DTOs.AIDTOs;

namespace ECommerce.Services.Abstraction;

public interface IReviewSummaryService
{
    Task<ReviewSummaryDTO?> GetSummaryAsync(int productId, CancellationToken ct = default);
}
