using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.NotificationModule;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.NotificationDTOs;
using Microsoft.AspNetCore.Identity;
using ECommerce.Domain.Entities.IdentityModule;

namespace ECommerce.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _userManager = userManager;
    }

    public async Task<Result<IEnumerable<NotificationDTO>>> GetForUserAsync(string email)
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        var items = await repo.GetAllAsync();
        var userItems = items
            .Where(n => string.Equals(n.UserEmail, email, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(n => n.CreatedAt)
            .Select(Map)
            .ToList();

        return Result<IEnumerable<NotificationDTO>>.Ok(userItems);
    }

    public async Task<Result<int>> GetUnreadCountAsync(string email)
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        var items = await repo.GetAllAsync();
        var count = items.Count(n =>
            string.Equals(n.UserEmail, email, StringComparison.OrdinalIgnoreCase) && !n.IsRead
        );
        return Result<int>.Ok(count);
    }

    public async Task<Result> MarkAsReadAsync(string email, int id)
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        var notification = await repo.GetByIdAsync(id);
        if (notification is null || !string.Equals(notification.UserEmail, email, StringComparison.OrdinalIgnoreCase))
            return Result.Fail(Error.NotFound("Notification.NotFound", "Notification not found."));

        notification.IsRead = true;
        repo.Update(notification);
        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result> MarkAllReadAsync(string email)
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        var items = (await repo.GetAllAsync()).Where(n =>
            string.Equals(n.UserEmail, email, StringComparison.OrdinalIgnoreCase) && !n.IsRead
        );

        foreach (var item in items)
        {
            item.IsRead = true;
            repo.Update(item);
        }

        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result> CreateForUserAsync(
        string email,
        string title,
        string body,
        string category = "general"
    )
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        await repo.AddAsync(
            new Notification
            {
                UserEmail = email,
                Title = title,
                Body = body,
                Category = category,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await _unitOfWork.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task SeedWelcomeNotificationsAsync()
    {
        var repo = _unitOfWork.GetRepository<Notification, int>();
        if ((await repo.GetAllAsync()).Any())
            return;

        foreach (var user in _userManager.Users.ToList())
        {
            if (string.IsNullOrWhiteSpace(user.Email))
                continue;

            await repo.AddAsync(
                new Notification
                {
                    UserEmail = user.Email,
                    Title = "Welcome to Corner Store",
                    Body =
                        "Your account is ready. Explore trending products and try the AI shopping assistant.",
                    Category = "welcome",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                }
            );

            await repo.AddAsync(
                new Notification
                {
                    UserEmail = user.Email,
                    Title = "Order updates",
                    Body = "We will notify you here when your orders ship or arrive.",
                    Category = "orders",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                }
            );
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private static NotificationDTO Map(Notification n) =>
        new(n.Id, n.Title, n.Body, n.IsRead, n.Category, n.CreatedAt);
}
