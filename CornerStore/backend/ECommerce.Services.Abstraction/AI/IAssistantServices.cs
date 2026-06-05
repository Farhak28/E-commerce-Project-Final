using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;

namespace ECommerce.Services.Abstraction.AI;

public record RagChunkHit(int ChunkId, int DocumentId, string Title, string Category, string Text, float Score);

public interface IRagService
{
    Task<IReadOnlyList<RagChunkHit>> RetrieveAsync(string query, int topK, CancellationToken ct = default);
    Task ReindexDocumentAsync(int documentId, CancellationToken ct = default);
    Task ReindexAllAsync(CancellationToken ct = default);
    Task EnsureTextChunksAsync(CancellationToken ct = default);
}

public interface IKnowledgeService
{
    Task<IReadOnlyList<KnowledgeDocumentDTO>> GetAllAsync(string? category = null, CancellationToken ct = default);
    Task<Result<KnowledgeDocumentDTO>> CreateAsync(CreateKnowledgeDocumentDTO dto, CancellationToken ct = default);
    Task<Result<KnowledgeDocumentDTO>> UpdateAsync(int id, UpdateKnowledgeDocumentDTO dto, CancellationToken ct = default);
    Task<Result> DeleteAsync(int id, CancellationToken ct = default);
    Task<KnowledgeChunksPageDTO> GetChunksAsync(int? documentId, int page, int pageSize, CancellationToken ct = default);
}

public interface IAssistantToolExecutor
{
    Task<string> ExecuteAsync(
        string toolName,
        string argumentsJson,
        string? userEmail,
        AssistantContextDTO context,
        CancellationToken ct = default
    );
}

public interface IChatAssistantService
{
    Task<AssistantStatusDTO> GetStatusAsync();
    Task<AssistantChatResponseDTO> ChatAsync(AssistantChatRequestDTO request, string? userEmail, CancellationToken ct = default);
    Task<AssistantSessionHistoryDTO?> GetSessionHistoryAsync(Guid sessionId, CancellationToken ct = default);
}
