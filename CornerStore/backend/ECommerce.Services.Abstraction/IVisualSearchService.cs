using ECommerce.Shared.DTOs.AIDTOs;

namespace ECommerce.Services.Abstraction;

public interface IVisualSearchService
{
    Task<VisualSearchResponseDTO> SearchAsync(
        VisualSearchRequestDTO request,
        string? userEmail,
        CancellationToken ct = default
    );
}
