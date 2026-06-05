using ECommerce.Domain.Entities.AdminModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.AdminDTOs;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Services;

public sealed class AuditLogService : IAuditLogService
{
    private readonly StoreDbContext _db;

    public AuditLogService(StoreDbContext db)
    {
        _db = db;
    }

    public async Task WriteAsync(
        string actorEmail,
        string action,
        string entityType,
        string? entityId = null,
        string? details = null,
        CancellationToken ct = default
    )
    {
        _db.AuditLogs.Add(new AuditLog
        {
            ActorEmail = actorEmail,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AuditLogsPageDTO> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        CancellationToken ct = default
    )
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.AuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.ActorEmail.Contains(term)
                || x.Action.Contains(term)
                || x.EntityType.Contains(term)
                || (x.EntityId != null && x.EntityId.Contains(term))
                || (x.Details != null && x.Details.Contains(term))
            );
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AuditLogDTO(
                x.Id,
                x.ActorEmail,
                x.Action,
                x.EntityType,
                x.EntityId,
                x.Details,
                x.CreatedAt
            ))
            .ToListAsync(ct);

        return new AuditLogsPageDTO(items, total, page, pageSize);
    }
}
