namespace AlmazManager.Domain.Entities;

public sealed class Stock : BaseEntity
{
    private Stock()
    {
    }

    public Stock(Guid materialId)
    {
        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал для остатка не указан.",
                nameof(materialId));
        }

        MaterialId = materialId;
        Quantity = 0;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public Guid MaterialId { get; private set; }

    public decimal Quantity { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void Increase(decimal quantity)
    {
        ValidateQuantity(quantity);

        Quantity += quantity;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Decrease(decimal quantity)
    {
        ValidateQuantity(quantity);

        if (Quantity < quantity)
        {
            throw new InvalidOperationException(
                "Недостаточно материала на складе.");
        }

        Quantity -= quantity;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Adjust(decimal newQuantity)
    {
        if (newQuantity < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(newQuantity),
                "Фактический остаток не может быть отрицательным.");
        }

        Quantity = newQuantity;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    private static void ValidateQuantity(decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(quantity),
                "Количество должно быть больше нуля.");
        }
    }
}
