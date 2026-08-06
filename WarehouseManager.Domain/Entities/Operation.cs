using WarehouseManager.Domain.Enums;

namespace WarehouseManager.Domain.Entities;

public sealed class Operation : BaseEntity
{
    private Operation()
    {
    }

    public Operation(
        Guid materialId,
        OperationType type,
        decimal quantity,
        Guid userId,
        string? comment = null)
    {
        ChangeMaterial(materialId);
        ChangeType(type);
        ChangeQuantity(quantity);
        ChangeUser(userId);
        ChangeComment(comment);
    }

    public Guid MaterialId { get; private set; }

    public OperationType Type { get; private set; }

    public decimal Quantity { get; private set; }

    public Guid UserId { get; private set; }

    public string? Comment { get; private set; }

    public void ChangeMaterial(Guid materialId)
    {
        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал для операции не указан.",
                nameof(materialId));
        }

        MaterialId = materialId;
    }

    public void ChangeType(OperationType type)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(
                nameof(type),
                "Неизвестный тип складской операции.");
        }

        Type = type;
    }

    public void ChangeQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantity),
                "Количество в операции должно быть больше нуля.");
        }

        Quantity = quantity;
    }

    public void ChangeUser(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь, выполнивший операцию, не указан.",
                nameof(userId));
        }

        UserId = userId;
    }

    public void ChangeComment(string? comment)
    {
        Comment = string.IsNullOrWhiteSpace(comment)
            ? null
            : comment.Trim();
    }
}