namespace AlmazManager.Domain.Entities;

public sealed class SupplyInvoiceItem : BaseEntity
{
    private SupplyInvoiceItem()
    {
    }

    public SupplyInvoiceItem(Guid supplyInvoiceId, Guid materialId, decimal expectedQuantity)
    {
        if (supplyInvoiceId == Guid.Empty)
            throw new ArgumentException("Счёт не указан.", nameof(supplyInvoiceId));

        if (materialId == Guid.Empty)
            throw new ArgumentException("Материал не указан.", nameof(materialId));

        SupplyInvoiceId = supplyInvoiceId;
        MaterialId = materialId;
        ChangeExpectedQuantity(expectedQuantity);
    }

    public Guid SupplyInvoiceId { get; private set; }
    public Guid MaterialId { get; private set; }
    public decimal ExpectedQuantity { get; private set; }
    public decimal ReceivedQuantity { get; private set; }
    public decimal RemainingQuantity => Math.Max(0, ExpectedQuantity - ReceivedQuantity);

    public void ChangeExpectedQuantity(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Ожидаемое количество должно быть больше нуля.");

        if (quantity < ReceivedQuantity)
            throw new InvalidOperationException("Ожидаемое количество не может быть меньше уже полученного.");

        ExpectedQuantity = quantity;
    }

    public void RegisterReceipt(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity), "Количество прихода должно быть больше нуля.");

        if (quantity > RemainingQuantity)
            throw new InvalidOperationException("Количество прихода превышает остаток ожидаемой поставки.");

        ReceivedQuantity += quantity;
    }

    public void ReverseReceipt(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentOutOfRangeException(nameof(quantity));

        if (quantity > ReceivedQuantity)
            throw new InvalidOperationException("Нельзя отменить больше полученного количества.");

        ReceivedQuantity -= quantity;
    }
}
