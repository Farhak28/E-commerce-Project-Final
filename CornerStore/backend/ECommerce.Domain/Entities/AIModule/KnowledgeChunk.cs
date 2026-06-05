using ECommerce.Domain.Entities;

namespace ECommerce.Domain.Entities.AIModule;

public class KnowledgeChunk : BaseEntity<int>
{
    public int DocumentId { get; set; }
    public KnowledgeDocument Document { get; set; } = default!;
    public int ChunkIndex { get; set; }
    public string Text { get; set; } = default!;
    /// <summary>JSON-serialized float[] embedding vector.</summary>
    public string EmbeddingJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
