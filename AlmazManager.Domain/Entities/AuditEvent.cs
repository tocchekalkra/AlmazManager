namespace AlmazManager.Domain.Entities;

public sealed class AuditEvent : BaseEntity
{
    private AuditEvent()
    {
    }

    public AuditEvent(
        Guid userId,
        string action,
        string entityType,
        Guid entityId,
        string description,
        Guid? materialId = null,
        Guid? documentId = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Пользователь не указан.", nameof(userId));

        if (entityId == Guid.Empty)
            throw new ArgumentException("Объект события не указан.", nameof(entityId));

        UserId = userId;
        Action = Normalize(action, 100, nameof(action));
        EntityType = Normalize(entityType, 100, nameof(entityType));
        EntityId = entityId;
        Description = Normalize(description, 1000, nameof(description));
        MaterialId = materialId;
        DocumentId = documentId;
    }

    public Guid UserId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityType { get; private set; } = string.Empty;
    public Guid EntityId { get; private set; }
    public Guid? MaterialId { get; private set; }
    public Guid? DocumentId { get; private set; }
    public string Description { get; private set; } = string.Empty;

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
