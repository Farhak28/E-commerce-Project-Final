using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.NotificationDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

[Authorize]
public class NotificationsController : ApiBaseController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetAll()
    {
        var result = await _notificationService.GetForUserAsync(GetEmailFromToken());
        return HandleResult(result);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var result = await _notificationService.GetUnreadCountAsync(GetEmailFromToken());
        return HandleResult(result);
    }

    [HttpPut("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var result = await _notificationService.MarkAsReadAsync(GetEmailFromToken(), id);
        return HandleResult(result);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var result = await _notificationService.MarkAllReadAsync(GetEmailFromToken());
        return HandleResult(result);
    }
}
