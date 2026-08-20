using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class Notification : BaseEntity
{
    private Notification()
    {
    }

    public Notification(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        Guid? materialId = null,
        Guid? supplyInvoiceId = null,
        string? deduplicationKey = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Пользователь не указан.", nameof(userId));

        if (!Enum.IsDefined(type))
            throw new ArgumentOutOfRangeException(nameof(type));

        UserId = userId;
        Type = type;
        Title = Normalize(title, 200, nameof(title));
        Message = Normalize(message, 1000, nameof(message));
        MaterialId = materialId;
        SupplyInvoiceId = supplyInvoiceId;
        DeduplicationKey = string.IsNullOrWhiteSpace(deduplicationKey)
            ? null
            : deduplicationKey.Trim();
    }

    public Guid UserId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public Guid? MaterialId { get; private set; }
    public Guid? SupplyInvoiceId { get; private set; }
    public string? DeduplicationKey { get; private set; }
    public DateTime? ReadAtUtc { get; private set; }
    public DateTime? ResolvedAtUtc { get; private set; }

    public bool IsRead => ReadAtUtc.HasValue;
    public bool IsResolved => ResolvedAtUtc.HasValue;

    public void MarkRead()
    {
        ReadAtUtc ??= DateTime.UtcNow;
    }

    public void Resolve()
    {
        ResolvedAtUtc ??= DateTime.UtcNow;
    }

    private static string Normalize(string value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Значение не указано.", paramName);

        var normalized = value.Trim();

        if (normalized.Length > maxLength)
            throw new ArgumentException($"Значение не может быть длиннее {maxLength} символов.", paramName);

        return normalized;
    }
}
