namespace AlmazManager.Contracts.Responses.Notifications;

public sealed record NotificationResponse(
    Guid Id,
    string Type,
    string Title,
    string Message,
    Guid? MaterialId,
    Guid? SupplyInvoiceId,
    DateTime CreatedAtUtc,
    DateTime? ReadAtUtc,
    DateTime? ResolvedAtUtc);

public sealed record NotificationListResponse(
    int UnreadCount,
    IReadOnlyList<NotificationResponse> Items);
