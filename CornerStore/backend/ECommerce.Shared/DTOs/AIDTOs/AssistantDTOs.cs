namespace ECommerce.Shared.DTOs.AIDTOs;

using ECommerce.Shared.DTOs.ProductDTOs;

public record KnowledgeDocumentDTO(
    int Id,
    string Title,
    string Content,
    string Category,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateKnowledgeDocumentDTO(string Title, string Content, string Category);

public record UpdateKnowledgeDocumentDTO(string Title, string Content, string Category);

public record AssistantContextDTO(
    IReadOnlyList<int>? CartProductIds = null,
    IReadOnlyList<int>? RecentProductIds = null,
    IReadOnlyList<int>? CompareIds = null
);

public record AssistantChatMessageDTO(string Role, string Content);

public record AssistantChatRequestDTO(
    Guid? SessionId,
    string Message,
    AssistantContextDTO? Context = null,
    IReadOnlyList<AssistantChatMessageDTO>? History = null
);

public record AssistantChatResponseDTO(
    Guid SessionId,
    string Text,
    IReadOnlyList<ProductDTO>? Products,
    bool Configured,
    string? Provider = null,
    AssistantStructuredDataDTO? Structured = null
);

public record AssistantStatusDTO(bool Configured, string? Provider, string? Model);

public record AssistantSessionHistoryDTO(
    Guid SessionId,
    IReadOnlyList<AssistantChatMessageDTO> Messages
);

public record ChatApiRequestDTO(string Message, Guid? SessionId = null);

public record ChatApiResponseDTO(
    Guid SessionId,
    string Response,
    IReadOnlyList<ProductDTO>? Products = null,
    AssistantStructuredDataDTO? Structured = null
);
