using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.NotificationDTOs;

namespace ECommerce.Services.Abstraction;

public interface INotificationService
{
    Task<Result<IEnumerable<NotificationDTO>>> GetForUserAsync(string email);
    Task<Result<int>> GetUnreadCountAsync(string email);
    Task<Result> MarkAsReadAsync(string email, int id);
    Task<Result> MarkAllReadAsync(string email);
    Task<Result> CreateForUserAsync(string email, string title, string body, string category = "general");
    Task SeedWelcomeNotificationsAsync();
}
