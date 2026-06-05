namespace ECommerce.Shared.DTOs.NotificationDTOs;

public record NotificationDTO(
    int Id,
    string Title,
    string Body,
    bool IsRead,
    string Category,
    DateTime CreatedAt
);
