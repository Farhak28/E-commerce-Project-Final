using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public sealed class RagService : IRagService
{
    private readonly StoreDbContext _db;
    private readonly IAIProvider _ai;
    private readonly IVectorStore _vectorStore;
    private readonly AiOptions _options;
    private readonly ILogger<RagService> _logger;

    public RagService(
        StoreDbContext db,
        IAIProvider ai,
        IVectorStore vectorStore,
        IOptions<AiOptions> options,
        ILogger<RagService> logger
    )
    {
        _db = db;
        _ai = ai;
        _vectorStore = vectorStore;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RagChunkHit>> RetrieveAsync(string query, int topK, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Array.Empty<RagChunkHit>();

        if (_ai.IsConfigured)
        {
            try
            {
                var embedding = await _ai.GenerateEmbeddingAsync(query, ct);
                var hits = await _vectorStore.SearchAsync(embedding, topK, ct);
                if (hits.Count > 0)
                {
                    return hits
                        .Select(h => new RagChunkHit(h.ChunkId, h.DocumentId, h.Title, h.Category, h.Text, h.Score))
                        .ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Vector RAG retrieval failed; falling back to keyword search");
            }
        }

        return await KeywordRetrieveAsync(query, topK, ct);
    }

    public async Task EnsureTextChunksAsync(CancellationToken ct = default)
    {
        var docs = await _db.KnowledgeDocuments.ToListAsync(ct);
        foreach (var doc in docs)
        {
            if (await _db.KnowledgeChunks.AnyAsync(c => c.DocumentId == doc.Id, ct))
                continue;
            await ChunkWithoutEmbeddingsAsync(doc, ct);
        }
    }

    public async Task ReindexDocumentAsync(int documentId, CancellationToken ct = default)
    {
        var doc = await _db.KnowledgeDocuments.Include(d => d.Chunks).FirstOrDefaultAsync(d => d.Id == documentId, ct);
        if (doc is null) return;

        _db.KnowledgeChunks.RemoveRange(doc.Chunks);
        doc.Chunks.Clear();
        await _db.SaveChangesAsync(ct);

        await _vectorStore.DeleteByDocumentAsync(documentId, ct);
        await ChunkAndIndexAsync(doc, ct);
    }

    public async Task ReindexAllAsync(CancellationToken ct = default)
    {
        await _vectorStore.ClearAsync(ct);
        var docs = await _db.KnowledgeDocuments.ToListAsync(ct);
        foreach (var doc in docs)
            await ReindexDocumentAsync(doc.Id, ct);
    }

    internal async Task ChunkWithoutEmbeddingsAsync(KnowledgeDocument doc, CancellationToken ct)
    {
        var chunks = ChunkText(doc.Content, _options.ChunkSize, _options.ChunkOverlap);
        for (var i = 0; i < chunks.Count; i++)
        {
            _db.KnowledgeChunks.Add(new KnowledgeChunk
            {
                DocumentId = doc.Id,
                ChunkIndex = i,
                Text = chunks[i],
                EmbeddingJson = EmbeddingJson.Serialize(Array.Empty<float>()),
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    internal async Task ChunkAndIndexAsync(KnowledgeDocument doc, CancellationToken ct)
    {
        var chunks = ChunkText(doc.Content, _options.ChunkSize, _options.ChunkOverlap);
        var entries = new List<VectorEntry>();

        for (var i = 0; i < chunks.Count; i++)
        {
            var text = chunks[i];
            float[] embedding = Array.Empty<float>();
            if (_ai.IsConfigured)
            {
                try
                {
                    embedding = await _ai.GenerateEmbeddingAsync(text, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Embedding failed for document {Id} chunk {Index}", doc.Id, i);
                }
            }

            var chunk = new KnowledgeChunk
            {
                DocumentId = doc.Id,
                ChunkIndex = i,
                Text = text,
                EmbeddingJson = EmbeddingJson.Serialize(embedding),
            };
            _db.KnowledgeChunks.Add(chunk);
            await _db.SaveChangesAsync(ct);

            if (embedding.Length > 0)
            {
                entries.Add(new VectorEntry(chunk.Id, doc.Id, doc.Title, doc.Category, text, embedding));
            }
        }

        if (entries.Count > 0)
            await _vectorStore.UpsertAsync(entries, ct);
    }

    private async Task<IReadOnlyList<RagChunkHit>> KeywordRetrieveAsync(string query, int topK, CancellationToken ct)
    {
        var terms = query
            .ToLowerInvariant()
            .Split([' ', ',', '.', '?', '!'], StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .Distinct()
            .Take(8)
            .ToList();

        if (terms.Count == 0)
            terms = [query.ToLowerInvariant()];

        var rows = await _db.KnowledgeChunks
            .AsNoTracking()
            .Include(c => c.Document)
            .ToListAsync(ct);

        var scored = rows
            .Select(row =>
            {
                var haystack = $"{row.Document.Title} {row.Document.Category} {row.Text}".ToLowerInvariant();
                var score = terms.Count(t => haystack.Contains(t, StringComparison.Ordinal));
                return (row, score);
            })
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .Take(topK)
            .Select(x => new RagChunkHit(
                x.row.Id,
                x.row.DocumentId,
                x.row.Document.Title,
                x.row.Document.Category,
                x.row.Text,
                x.score
            ))
            .ToList();

        return scored;
    }

    internal static List<string> ChunkText(string content, int chunkSize, int overlap = 0)
    {
        var chunks = new List<string>();
        if (string.IsNullOrWhiteSpace(content)) return chunks;
        var normalized = content.Trim();
        var step = Math.Max(1, chunkSize - Math.Max(0, overlap));
        for (var i = 0; i < normalized.Length; i += step)
        {
            var len = Math.Min(chunkSize, normalized.Length - i);
            chunks.Add(normalized.Substring(i, len));
            if (i + len >= normalized.Length) break;
        }
        return chunks;
    }
}
