using AlmazManager.Application.Features.Notifications.Handlers;
using AlmazManager.Contracts.Responses.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly NotificationHandler _handler;

    public NotificationsController(NotificationHandler handler)
    {
        _handler = handler;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationListResponse>> Get([FromQuery] bool unreadOnly = false) =>
        Ok(await _handler.GetAsync(unreadOnly));

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        await _handler.MarkReadAsync(id);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _handler.MarkAllReadAsync();
        return NoContent();
    }
}
