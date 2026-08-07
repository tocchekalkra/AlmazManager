using WarehouseManager.Domain.Enums;

namespace WarehouseManager.Domain.Entities;

public sealed class InventoryDocument
{
    private InventoryDocument()
    {
    }

    public InventoryDocument(
        Guid userId,
        string number,
        string? comment = null)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь не указан.",
                nameof(userId));
        }

        if (string.IsNullOrWhiteSpace(number))
        {
            throw new ArgumentException(
                "Номер документа не указан.",
                nameof(number));
        }

        Id = Guid.NewGuid();
        UserId = userId;
        Number = number.Trim();
        Comment = NormalizeComment(comment);
        Status = InventoryDocumentStatus.Draft;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Number { get; private set; } = string.Empty;

    public Guid UserId { get; private set; }

    public string? Comment { get; private set; }

    public InventoryDocumentStatus Status { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime? PostedAtUtc { get; private set; }

    public DateTime? CancelledAtUtc { get; private set; }

    public List<InventoryDocumentItem> Items { get; private set; } = new();

    public void AddItem(
        Guid materialId,
        decimal expectedQuantity,
        decimal actualQuantity)
    {
        EnsureDraft();

        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(materialId));
        }

        if (Items.Any(x => x.MaterialId == materialId))
        {
            throw new InvalidOperationException(
                "Материал уже добавлен в документ инвентаризации.");
        }

        Items.Add(
            new InventoryDocumentItem(
                Id,
                materialId,
                expectedQuantity,
                actualQuantity));
    }

    public void ChangeItemActualQuantity(
        Guid materialId,
        decimal actualQuantity)
    {
        EnsureDraft();

        var item = Items.FirstOrDefault(
            x => x.MaterialId == materialId);

        if (item is null)
        {
            throw new InvalidOperationException(
                "Материал отсутствует в документе инвентаризации.");
        }

        item.ChangeActualQuantity(actualQuantity);
    }

    public void RemoveItem(Guid materialId)
    {
        EnsureDraft();

        var item = Items.FirstOrDefault(
            x => x.MaterialId == materialId);

        if (item is null)
        {
            throw new InvalidOperationException(
                "Материал отсутствует в документе инвентаризации.");
        }

        Items.Remove(item);
    }

    public void ChangeComment(string? comment)
    {
        EnsureDraft();

        Comment = NormalizeComment(comment);
    }

    public void Post()
    {
        EnsureDraft();

        if (Items.Count == 0)
        {
            throw new InvalidOperationException(
                "Нельзя провести пустую инвентаризацию.");
        }

        Status = InventoryDocumentStatus.Posted;
        PostedAtUtc = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status != InventoryDocumentStatus.Posted)
        {
            throw new InvalidOperationException(
                "Отменить можно только проведённую инвентаризацию.");
        }

        Status = InventoryDocumentStatus.Cancelled;
        CancelledAtUtc = DateTime.UtcNow;
    }

    public void EnsureCanDelete()
    {
        if (Status != InventoryDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Удалить можно только черновик инвентаризации.");
        }
    }

    private void EnsureDraft()
    {
        if (Status != InventoryDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Изменять можно только черновик инвентаризации.");
        }
    }

    private static string? NormalizeComment(string? comment)
    {
        if (string.IsNullOrWhiteSpace(comment))
        {
            return null;
        }

        var value = comment.Trim();

        if (value.Length > 1000)
        {
            throw new ArgumentException(
                "Комментарий не может быть длиннее 1000 символов.");
        }

        return value;
    }
}