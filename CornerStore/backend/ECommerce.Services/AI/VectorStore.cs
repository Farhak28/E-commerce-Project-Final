using System.Collections.Concurrent;
using System.Text.Json;
using ECommerce.Services.Abstraction.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public sealed class InMemoryVectorStore : IVectorStore
{
    private readonly ConcurrentDictionary<int, VectorEntry> _entries = new();
    private readonly ILogger<InMemoryVectorStore> _logger;

    public InMemoryVectorStore(ILogger<InMemoryVectorStore> logger)
    {
        _logger = logger;
    }

    public Task UpsertAsync(IEnumerable<VectorEntry> entries, CancellationToken ct = default)
    {
        foreach (var entry in entries)
            _entries[entry.ChunkId] = entry;
        return Task.CompletedTask;
    }

    public Task DeleteByDocumentAsync(int documentId, CancellationToken ct = default)
    {
        foreach (var key in _entries.Keys.Where(k => _entries[k].DocumentId == documentId).ToList())
            _entries.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    public Task ClearAsync(CancellationToken ct = default)
    {
        _entries.Clear();
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<VectorSearchHit>> SearchAsync(float[] queryEmbedding, int topK, CancellationToken ct = default)
    {
        var hits = _entries.Values
            .Select(e => new VectorSearchHit(
                e.ChunkId,
                e.DocumentId,
                e.Title,
                e.Category,
                e.Text,
                CosineSimilarity(queryEmbedding, e.Embedding)
            ))
            .Where(h => h.Score > 0)
            .OrderByDescending(h => h.Score)
            .Take(topK)
            .ToList();

        _logger.LogDebug("Vector search returned {Count} hits", hits.Count);
        return Task.FromResult<IReadOnlyList<VectorSearchHit>>(hits);
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0 || a.Length != b.Length) return 0f;
        double dot = 0, na = 0, nb = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return 0f;
        return (float)(dot / (Math.Sqrt(na) * Math.Sqrt(nb)));
    }
}

public interface IVectorStore
{
    Task UpsertAsync(IEnumerable<VectorEntry> entries, CancellationToken ct = default);
    Task DeleteByDocumentAsync(int documentId, CancellationToken ct = default);
    Task ClearAsync(CancellationToken ct = default);
    Task<IReadOnlyList<VectorSearchHit>> SearchAsync(float[] queryEmbedding, int topK, CancellationToken ct = default);
}

public record VectorEntry(
    int ChunkId,
    int DocumentId,
    string Title,
    string Category,
    string Text,
    float[] Embedding
);

public record VectorSearchHit(
    int ChunkId,
    int DocumentId,
    string Title,
    string Category,
    string Text,
    float Score
);

public static class EmbeddingJson
{
    public static string Serialize(float[] v) => JsonSerializer.Serialize(v);
    public static float[] Deserialize(string json) =>
        JsonSerializer.Deserialize<float[]>(json) ?? Array.Empty<float>();
}
