using AlmazManager.Application.Interfaces;
using AlmazManager.Contracts.Responses.Notifications;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Notifications.Handlers;

public sealed class NotificationHandler
{
    private readonly INotificationRepository _repository;
    private readonly ICurrentUserService _currentUser;
    private readonly IStockNotificationService _notificationService;

    public NotificationHandler(
        INotificationRepository repository,
        ICurrentUserService currentUser,
        IStockNotificationService notificationService)
    {
        _repository = repository;
        _currentUser = currentUser;
        _notificationService = notificationService;
    }

    public async Task<NotificationListResponse> GetAsync(bool unreadOnly)
    {
        await _notificationService.RefreshSupplyRemindersAsync();
        var items = await _repository.GetByUserIdAsync(_currentUser.UserId, unreadOnly);
        var all = unreadOnly
            ? await _repository.GetByUserIdAsync(_currentUser.UserId)
            : items;

        return new NotificationListResponse(
            all.Count(x => !x.IsRead),
            items.Select(Map).ToList());
    }

    public async Task MarkReadAsync(Guid notificationId)
    {
        var notification = await _repository.GetByIdAsync(notificationId)
            ?? throw new InvalidOperationException("Уведомление не найдено.");

        if (notification.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Нет доступа к уведомлению.");

        notification.MarkRead();
        await _repository.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync()
    {
        var items = await _repository.GetByUserIdAsync(_currentUser.UserId, true);
        foreach (var item in items)
            item.MarkRead();

        await _repository.SaveChangesAsync();
    }

    private static NotificationResponse Map(Domain.Entities.Notification item) =>
        new(
            item.Id,
            item.Type.ToString(),
            item.Title,
            item.Message,
            item.MaterialId,
            item.SupplyInvoiceId,
            item.CreatedAtUtc,
            item.ReadAtUtc,
            item.ResolvedAtUtc);
}
