using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class Operation : BaseEntity
{
    private Operation()
    {
    }

    // Старый конструктор оставляем для совместимости
    // с уже существующими Receiving / Issue / Inventory.
    public Operation(
        Guid materialId,
        OperationType type,
        decimal quantity,
        Guid userId,
        string? comment = null)
    {
        ValidateMaterial(materialId);
        ValidateType(type);
        ValidatePositiveQuantity(quantity);
        ValidateUser(userId);

        MaterialId = materialId;
        Type = type;
        Quantity = quantity;
        UserId = userId;
        Comment = NormalizeComment(comment);

        var legacyChange = GetLegacySignedQuantity(
            type,
            quantity);

        if (legacyChange < 0)
        {
            QuantityBefore = quantity;
            QuantityChange = legacyChange;
            QuantityAfter = 0;
        }
        else
        {
            QuantityBefore = 0;
            QuantityChange = legacyChange;
            QuantityAfter = legacyChange;
        }
    }

    // Новый полноценный конструктор журнала.
    public Operation(
        Guid materialId,
        OperationType type,
        decimal quantityBefore,
        decimal quantityChange,
        decimal quantityAfter,
        Guid userId,
        Guid? documentId,
        bool isReversal,
        Guid? reversedOperationId,
        string? comment = null)
    {
        ValidateMaterial(materialId);
        ValidateType(type);
        ValidateUser(userId);

        if (quantityBefore < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantityBefore),
                "Остаток до операции не может быть отрицательным.");
        }

        if (quantityAfter < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantityAfter),
                "Остаток после операции не может быть отрицательным.");
        }

        if (quantityChange == 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantityChange),
                "Изменение количества не может быть равно нулю.");
        }

        if (quantityAfter != quantityBefore + quantityChange)
        {
            throw new ArgumentException(
                "Остаток после операции не соответствует произведённому изменению.");
        }

        if (documentId.HasValue &&
            documentId.Value == Guid.Empty)
        {
            throw new ArgumentException(
                "Некорректный идентификатор документа.",
                nameof(documentId));
        }

        if (reversedOperationId.HasValue &&
            reversedOperationId.Value == Guid.Empty)
        {
            throw new ArgumentException(
                "Некорректный идентификатор отменяемой операции.",
                nameof(reversedOperationId));
        }

        MaterialId = materialId;
        Type = type;

        QuantityBefore = quantityBefore;
        QuantityChange = quantityChange;
        QuantityAfter = quantityAfter;

        // Оставляем это поле для совместимости
        // со старым API.
        Quantity = Math.Abs(quantityChange);

        UserId = userId;

        DocumentId = documentId;
        IsReversal = isReversal;
        ReversedOperationId = reversedOperationId;

        Comment = NormalizeComment(comment);
    }

    public Guid MaterialId { get; private set; }

    public OperationType Type { get; private set; }

    public decimal Quantity { get; private set; }

    public decimal QuantityBefore { get; private set; }

    public decimal QuantityChange { get; private set; }

    public decimal QuantityAfter { get; private set; }

    public Guid UserId { get; private set; }

    public Guid? DocumentId { get; private set; }

    public bool IsReversal { get; private set; }

    public Guid? ReversedOperationId { get; private set; }

    public string? Comment { get; private set; }

    private static void ValidateMaterial(Guid materialId)
    {
        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал для операции не указан.",
                nameof(materialId));
        }
    }

    private static void ValidateType(OperationType type)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(
                nameof(type),
                "Неизвестный тип складской операции.");
        }
    }

    private static void ValidatePositiveQuantity(
        decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantity),
                "Количество в операции должно быть больше нуля.");
        }
    }

    private static void ValidateUser(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь, выполнивший операцию, не указан.",
                nameof(userId));
        }
    }

    private static decimal GetLegacySignedQuantity(
        OperationType type,
        decimal quantity)
    {
        return type == OperationType.Issue
            ? -quantity
            : quantity;
    }

    private static string? NormalizeComment(
        string? comment)
    {
        return string.IsNullOrWhiteSpace(comment)
            ? null
            : comment.Trim();
    }
}
