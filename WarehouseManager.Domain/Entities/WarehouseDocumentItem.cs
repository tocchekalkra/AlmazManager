namespace WarehouseManager.Domain.Entities;

public sealed class WarehouseDocumentItem : BaseEntity
{
    private WarehouseDocumentItem()
    {
    }

    public WarehouseDocumentItem(
        Guid documentId,
        Guid materialId,
        decimal quantity)
    {
        if (documentId == Guid.Empty)
        {
            throw new ArgumentException(
                "Документ не указан.",
                nameof(documentId));
        }

        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(materialId));
        }

        DocumentId = documentId;
        MaterialId = materialId;

        ChangeQuantity(quantity);
    }

    public Guid DocumentId { get; private set; }

    public Guid MaterialId { get; private set; }

    public decimal Quantity { get; private set; }

    public void ChangeQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantity),
                "Количество должно быть больше нуля.");
        }

        Quantity = quantity;
    }
}