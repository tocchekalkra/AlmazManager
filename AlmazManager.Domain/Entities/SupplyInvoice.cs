using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class SupplyInvoice : BaseEntity
{
    private SupplyInvoice()
    {
    }

    public SupplyInvoice(
        Guid createdByUserId,
        string supplier,
        string invoiceNumber,
        DateOnly invoiceDate,
        decimal amount,
        DateOnly? paymentDueDate,
        DateOnly? expectedDeliveryDate,
        string? comment)
    {
        if (createdByUserId == Guid.Empty)
            throw new ArgumentException("Пользователь не указан.", nameof(createdByUserId));

        CreatedByUserId = createdByUserId;
        ChangeDetails(
            supplier,
            invoiceNumber,
            invoiceDate,
            amount,
            paymentDueDate,
            expectedDeliveryDate,
            comment);

        Status = SupplyInvoiceStatus.AwaitingPayment;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid CreatedByUserId { get; private set; }
    public string Supplier { get; private set; } = string.Empty;
    public string InvoiceNumber { get; private set; } = string.Empty;
    public DateOnly InvoiceDate { get; private set; }
    public decimal Amount { get; private set; }
    public DateOnly? PaymentDueDate { get; private set; }
    public DateOnly? ExpectedDeliveryDate { get; private set; }
    public string? AttachmentPath { get; private set; }
    public string? Comment { get; private set; }
    public SupplyInvoiceStatus Status { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public List<SupplyInvoiceItem> Items { get; private set; } = [];

    public void ChangeDetails(
        string supplier,
        string invoiceNumber,
        DateOnly invoiceDate,
        decimal amount,
        DateOnly? paymentDueDate,
        DateOnly? expectedDeliveryDate,
        string? comment)
    {
        Supplier = NormalizeRequired(supplier, 250, nameof(supplier));
        InvoiceNumber = NormalizeRequired(invoiceNumber, 100, nameof(invoiceNumber));

        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Сумма счёта не может быть отрицательной.");

        InvoiceDate = invoiceDate;
        Amount = amount;
        PaymentDueDate = paymentDueDate;
        ExpectedDeliveryDate = expectedDeliveryDate;
        Comment = NormalizeOptional(comment, 1000, nameof(comment));
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void ReplaceItems(IEnumerable<(Guid MaterialId, decimal ExpectedQuantity)> items)
    {
        var requested = items.ToList();

        if (requested.Count == 0)
            throw new InvalidOperationException("Счёт должен содержать хотя бы один материал.");

        if (requested.GroupBy(x => x.MaterialId).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Материал нельзя добавлять в счёт несколько раз.");

        foreach (var item in requested)
        {
            if (item.MaterialId == Guid.Empty || item.ExpectedQuantity <= 0)
                throw new ArgumentException("Материал и ожидаемое количество должны быть указаны.");
        }

        var requestedIds = requested.Select(x => x.MaterialId).ToHashSet();

        foreach (var existing in Items.Where(x => !requestedIds.Contains(x.MaterialId)).ToList())
        {
            if (existing.ReceivedQuantity > 0)
                throw new InvalidOperationException("Нельзя удалить материал, по которому уже был приход.");

            Items.Remove(existing);
        }

        foreach (var requestedItem in requested)
        {
            var existing = Items.FirstOrDefault(x => x.MaterialId == requestedItem.MaterialId);

            if (existing is null)
            {
                Items.Add(new SupplyInvoiceItem(Id, requestedItem.MaterialId, requestedItem.ExpectedQuantity));
            }
            else
            {
                existing.ChangeExpectedQuantity(requestedItem.ExpectedQuantity);
            }
        }

        UpdatedAtUtc = DateTime.UtcNow;
        RefreshDeliveryStatus();
    }

    public void ChangeStatus(SupplyInvoiceStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ArgumentOutOfRangeException(nameof(status));

        if (status == SupplyInvoiceStatus.FullyReceived &&
            Items.Any(x => x.RemainingQuantity > 0))
        {
            throw new InvalidOperationException("Счёт нельзя закрыть: поставка получена не полностью.");
        }

        Status = status;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void SetAttachment(string? attachmentPath)
    {
        AttachmentPath = NormalizeOptional(attachmentPath, 500, nameof(attachmentPath));
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void RegisterReceipt(Guid materialId, decimal quantity)
    {
        if (Status == SupplyInvoiceStatus.Cancelled)
            throw new InvalidOperationException("Нельзя принять поставку по отменённому счёту.");

        var item = Items.FirstOrDefault(x => x.MaterialId == materialId)
            ?? throw new InvalidOperationException("Материал отсутствует в счёте.");

        item.RegisterReceipt(quantity);
        UpdatedAtUtc = DateTime.UtcNow;
        RefreshDeliveryStatus();
    }

    public void ReverseReceipt(Guid materialId, decimal quantity)
    {
        var item = Items.FirstOrDefault(x => x.MaterialId == materialId)
            ?? throw new InvalidOperationException("Материал отсутствует в счёте.");

        item.ReverseReceipt(quantity);
        UpdatedAtUtc = DateTime.UtcNow;

        if (Items.Any(x => x.ReceivedQuantity > 0))
            Status = SupplyInvoiceStatus.PartiallyReceived;
        else
            Status = SupplyInvoiceStatus.AwaitingDelivery;
    }

    private void RefreshDeliveryStatus()
    {
        if (Status == SupplyInvoiceStatus.Cancelled || Items.Count == 0)
            return;

        if (Items.All(x => x.RemainingQuantity == 0))
            Status = SupplyInvoiceStatus.FullyReceived;
        else if (Items.Any(x => x.ReceivedQuantity > 0))
            Status = SupplyInvoiceStatus.PartiallyReceived;
    }

    private static string NormalizeRequired(string value, int maxLength, string paramName)
    {
        var normalized = NormalizeOptional(value, maxLength, paramName);
        return normalized ?? throw new ArgumentException("Значение не указано.", paramName);
    }

    private static string? NormalizeOptional(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim();

        if (normalized.Length > maxLength)
            throw new ArgumentException($"Значение не может быть длиннее {maxLength} символов.", paramName);

        return normalized;
    }
}
