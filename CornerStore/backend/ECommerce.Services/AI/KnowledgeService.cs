using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ECommerce.Services.AI;

public sealed class KnowledgeService : IKnowledgeService
{
    private readonly StoreDbContext _db;
    private readonly IRagService _rag;
    private readonly ILogger<KnowledgeService> _logger;

    public KnowledgeService(StoreDbContext db, IRagService rag, ILogger<KnowledgeService> logger)
    {
        _db = db;
        _rag = rag;
        _logger = logger;
    }

    public async Task<IReadOnlyList<KnowledgeDocumentDTO>> GetAllAsync(string? category = null, CancellationToken ct = default)
    {
        var query = _db.KnowledgeDocuments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(d => d.Category == category);

        return await query
            .OrderBy(d => d.Category)
            .ThenBy(d => d.Title)
            .Select(d => ToDto(d))
            .ToListAsync(ct);
    }

    public async Task<Result<KnowledgeDocumentDTO>> CreateAsync(CreateKnowledgeDocumentDTO dto, CancellationToken ct = default)
    {
        var entity = new KnowledgeDocument
        {
            Title = dto.Title.Trim(),
            Content = dto.Content.Trim(),
            Category = dto.Category.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.KnowledgeDocuments.Add(entity);
        await _db.SaveChangesAsync(ct);
        await ((RagService)_rag).ChunkAndIndexAsync(entity, ct);
        _logger.LogInformation("Knowledge document created {Id}", entity.Id);
        return ToDto(entity);
    }

    public async Task<Result<KnowledgeDocumentDTO>> UpdateAsync(int id, UpdateKnowledgeDocumentDTO dto, CancellationToken ct = default)
    {
        var entity = await _db.KnowledgeDocuments.FindAsync([id], ct);
        if (entity is null)
            return Error.NotFound("Knowledge.NotFound", "Document not found.");

        entity.Title = dto.Title.Trim();
        entity.Content = dto.Content.Trim();
        entity.Category = dto.Category.Trim();
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _rag.ReindexDocumentAsync(id, ct);
        return ToDto(entity);
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.KnowledgeDocuments.FindAsync([id], ct);
        if (entity is null)
            return Result.Fail(Error.NotFound("Knowledge.NotFound", "Document not found."));

        _db.KnowledgeDocuments.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return Result.Ok();
    }

    public async Task<KnowledgeChunksPageDTO> GetChunksAsync(
        int? documentId,
        int page,
        int pageSize,
        CancellationToken ct = default
    )
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.KnowledgeChunks.AsNoTracking()
            .Include(c => c.Document)
            .OrderBy(c => c.DocumentId)
            .ThenBy(c => c.ChunkIndex)
            .AsQueryable();

        if (documentId.HasValue)
            query = query.Where(c => c.DocumentId == documentId.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new KnowledgeChunkDTO(
                c.Id,
                c.DocumentId,
                c.Document.Title,
                c.ChunkIndex,
                c.Text.Length > 200 ? c.Text.Substring(0, 200) + "…" : c.Text,
                c.EmbeddingJson != "" && c.EmbeddingJson != "[]",
                c.CreatedAt
            ))
            .ToListAsync(ct);

        return new KnowledgeChunksPageDTO(items, total, page, pageSize);
    }

    private static KnowledgeDocumentDTO ToDto(KnowledgeDocument d) =>
        new(d.Id, d.Title, d.Content, d.Category, d.CreatedAt, d.UpdatedAt);
}
