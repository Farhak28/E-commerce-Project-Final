namespace ECommerce.Services.Abstraction;

using ECommerce.Shared.DTOs.AdminDTOs;

public interface IAuditLogService
{
    Task WriteAsync(
        string actorEmail,
        string action,
        string entityType,
        string? entityId = null,
        string? details = null,
        CancellationToken ct = default
    );

    Task<AuditLogsPageDTO> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        CancellationToken ct = default
    );
}
