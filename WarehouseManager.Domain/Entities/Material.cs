using WarehouseManager.Domain.Enums;

namespace WarehouseManager.Domain.Entities;

public sealed class Material : BaseEntity
{
    private Material()
    {
    }

    public Material(
        string name,
        string article,
        Guid categoryId,
        MeasurementUnit unit,
        decimal minimumQuantity)
    {
        Rename(name);
        ChangeArticle(article);
        ChangeCategory(categoryId);
        ChangeUnit(unit);
        ChangeMinimumQuantity(minimumQuantity);
    }

    public string Name { get; private set; } = string.Empty;

    public string Article { get; private set; } = string.Empty;

    public Guid CategoryId { get; private set; }

    public MeasurementUnit Unit { get; private set; }

    public decimal MinimumQuantity { get; private set; }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException(
                "Название материала не может быть пустым.",
                nameof(name));

        Name = name.Trim();
    }

    public void ChangeArticle(string article)
    {
        if (string.IsNullOrWhiteSpace(article))
            throw new ArgumentException(
                "Артикул материала не может быть пустым.",
                nameof(article));

        Article = article.Trim();
    }

    public void ChangeCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new ArgumentException(
                "Категория не указана.",
                nameof(categoryId));

        CategoryId = categoryId;
    }

    public void ChangeUnit(MeasurementUnit unit)
    {
        Unit = unit;
    }

    public void ChangeMinimumQuantity(decimal minimumQuantity)
    {
        if (minimumQuantity < 0)
            throw new ArgumentException(
                "Минимальный остаток не может быть отрицательным.");

        MinimumQuantity = minimumQuantity;
    }

    public void Archive()
    {
        IsActive = false;
    }

    public void Restore()
    {
        IsActive = true;
    }
}