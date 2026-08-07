namespace WarehouseManager.Domain.Entities;

public sealed class InventoryDocumentItem
{
    private InventoryDocumentItem()
    {
    }

    public InventoryDocumentItem(
        Guid inventoryDocumentId,
        Guid materialId,
        decimal expectedQuantity,
        decimal actualQuantity)
    {
        if (inventoryDocumentId == Guid.Empty)
            throw new ArgumentException(
                "Документ инвентаризации не указан.",
                nameof(inventoryDocumentId));

        if (materialId == Guid.Empty)
            throw new ArgumentException(
                "Материал не указан.",
                nameof(materialId));

        if (expectedQuantity < 0)
            throw new ArgumentOutOfRangeException(
                nameof(expectedQuantity),
                "Учётное количество не может быть отрицательным.");

        if (actualQuantity < 0)
            throw new ArgumentOutOfRangeException(
                nameof(actualQuantity),
                "Фактическое количество не может быть отрицательным.");

        Id = Guid.NewGuid();
        InventoryDocumentId = inventoryDocumentId;
        MaterialId = materialId;
        ExpectedQuantity = expectedQuantity;
        ActualQuantity = actualQuantity;
    }

    public Guid Id { get; private set; }

    public Guid InventoryDocumentId { get; private set; }

    public Guid MaterialId { get; private set; }

    public decimal ExpectedQuantity { get; private set; }

    public decimal ActualQuantity { get; private set; }

    public decimal Difference =>
        ActualQuantity - ExpectedQuantity;

    public void ChangeActualQuantity(decimal actualQuantity)
    {
        if (actualQuantity < 0)
            throw new ArgumentOutOfRangeException(
                nameof(actualQuantity),
                "Фактическое количество не может быть отрицательным.");

        ActualQuantity = actualQuantity;
    }
}