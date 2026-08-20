using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class WarehouseDocument : BaseEntity
{
    private WarehouseDocument()
    {
    }

    public WarehouseDocument(
        string number,
        WarehouseDocumentType type,
        Guid userId,
        DateOnly documentDate,
        Guid? supplyInvoiceId,
        string? supplier,
        string? externalNumber,
        string? recipient,
        string? comment)
    {
        if (string.IsNullOrWhiteSpace(number))
        {
            throw new ArgumentException(
                "Номер документа не указан.",
                nameof(number));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь не указан.",
                nameof(userId));
        }

        Number = number.Trim();
        Type = type;
        UserId = userId;
        DocumentDate = documentDate;
        SupplyInvoiceId = supplyInvoiceId;
        Status = WarehouseDocumentStatus.Draft;

        ChangeSupplier(supplier);
        ChangeExternalNumber(externalNumber);
        ChangeRecipient(recipient);
        ChangeComment(comment);
    }

    public string Number { get; private set; } =
        string.Empty;

    public WarehouseDocumentType Type { get; private set; }

    public WarehouseDocumentStatus Status { get; private set; }

    public Guid UserId { get; private set; }

    public int? SequenceNumber { get; private set; }

    public DateOnly DocumentDate { get; private set; }

    public Guid? SupplyInvoiceId { get; private set; }

    public string? Supplier { get; private set; }

    public string? ExternalNumber { get; private set; }

    public string? Recipient { get; private set; }

    public string? Comment { get; private set; }

    public DateTime? PostedAtUtc { get; private set; }

    public DateTime? CancelledAtUtc { get; private set; }

    public List<WarehouseDocumentItem> Items { get; private set; } =
        new();

    public void ChangeSupplier(string? supplier)
    {
        EnsureDraft();

        if (!string.IsNullOrWhiteSpace(supplier) &&
            supplier.Trim().Length > 250)
        {
            throw new ArgumentException(
                "Название поставщика не может быть длиннее 250 символов.",
                nameof(supplier));
        }

        Supplier =
            string.IsNullOrWhiteSpace(supplier)
                ? null
                : supplier.Trim();
    }

    public void ChangeExternalNumber(
        string? externalNumber)
    {
        EnsureDraft();

        if (!string.IsNullOrWhiteSpace(externalNumber) &&
            externalNumber.Trim().Length > 100)
        {
            throw new ArgumentException(
                "Номер накладной не может быть длиннее 100 символов.",
                nameof(externalNumber));
        }

        ExternalNumber =
            string.IsNullOrWhiteSpace(externalNumber)
                ? null
                : externalNumber.Trim();
    }

    public void ChangeDocumentDate(DateOnly documentDate)
    {
        EnsureDraft();

        DocumentDate = documentDate;
    }

    public void ChangeRecipient(string? recipient)
    {
        EnsureDraft();

        if (!string.IsNullOrWhiteSpace(recipient) &&
            recipient.Trim().Length > 250)
        {
            throw new ArgumentException(
                "Получатель или объект не может быть длиннее 250 символов.",
                nameof(recipient));
        }

        Recipient =
            string.IsNullOrWhiteSpace(recipient)
                ? null
                : recipient.Trim();
    }

    public void AssignNumber(int sequenceNumber)
    {
        EnsureDraft();

        if (sequenceNumber <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(sequenceNumber),
                "Номер документа должен быть больше нуля.");
        }

        SequenceNumber = sequenceNumber;

        var prefix =
            Type == WarehouseDocumentType.Receiving
                ? "П"
                : "Р";

        Number =
            $"{prefix}{sequenceNumber} — {DocumentDate:dd_MM_yyyy}";
    }

    public void ChangeComment(string? comment)
    {
        EnsureDraft();

        if (!string.IsNullOrWhiteSpace(comment) &&
            comment.Trim().Length > 1000)
        {
            throw new ArgumentException(
                "Комментарий документа не может быть длиннее 1000 символов.",
                nameof(comment));
        }

        Comment =
            string.IsNullOrWhiteSpace(comment)
                ? null
                : comment.Trim();
    }

    public void AddItem(
        Guid materialId,
        decimal quantity)
    {
        EnsureDraft();

        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(materialId));
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantity),
                "Количество должно быть больше нуля.");
        }

        if (Items.Any(x =>
                x.MaterialId == materialId))
        {
            throw new InvalidOperationException(
                "Материал уже добавлен в документ.");
        }

        Items.Add(
            new WarehouseDocumentItem(
                Id,
                materialId,
                quantity));
    }

    public void ReplaceItems(
        IEnumerable<(Guid MaterialId, decimal Quantity)> items)
    {
        EnsureDraft();

        var requestedItems =
            items.ToList();

        if (requestedItems.Count == 0)
        {
            throw new InvalidOperationException(
                "Документ должен содержать хотя бы одну позицию.");
        }

        var duplicates =
            requestedItems
                .GroupBy(x => x.MaterialId)
                .Any(group => group.Count() > 1);

        if (duplicates)
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять в документ несколько раз.");
        }

        foreach (var item in requestedItems)
        {
            if (item.MaterialId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Материал не указан.");
            }

            if (item.Quantity <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(item.Quantity),
                    "Количество должно быть больше нуля.");
            }
        }

        var requestedMaterialIds =
            requestedItems
                .Select(x => x.MaterialId)
                .ToHashSet();

        var itemsToRemove =
            Items
                .Where(existing =>
                    !requestedMaterialIds.Contains(
                        existing.MaterialId))
                .ToList();

        foreach (var itemToRemove in itemsToRemove)
        {
            Items.Remove(itemToRemove);
        }

        foreach (var requestedItem in requestedItems)
        {
            var existingItem =
                Items.FirstOrDefault(x =>
                    x.MaterialId ==
                    requestedItem.MaterialId);

            if (existingItem is not null)
            {
                existingItem.ChangeQuantity(
                    requestedItem.Quantity);

                continue;
            }

            Items.Add(
                new WarehouseDocumentItem(
                    Id,
                    requestedItem.MaterialId,
                    requestedItem.Quantity));
        }
    }

    public void Post()
    {
        EnsureDraft();

        if (Items.Count == 0)
        {
            throw new InvalidOperationException(
                "Документ не содержит материалов.");
        }

        Status =
            WarehouseDocumentStatus.Posted;

        PostedAtUtc =
            DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status !=
            WarehouseDocumentStatus.Posted)
        {
            throw new InvalidOperationException(
                "Отменить можно только проведённый документ.");
        }

        Status =
            WarehouseDocumentStatus.Cancelled;

        CancelledAtUtc =
            DateTime.UtcNow;
    }

    public void EnsureCanDelete()
    {
        if (Status !=
            WarehouseDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Удалить можно только черновик документа.");
        }
    }

    private void EnsureDraft()
    {
        if (Status !=
            WarehouseDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Изменять можно только черновик документа.");
        }
    }
}
