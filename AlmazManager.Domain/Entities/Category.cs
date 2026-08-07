namespace AlmazManager.Domain.Entities;

public sealed class Category : BaseEntity
{
    private Category()
    {
    }

    public Category(string name)
    {
        Rename(name);
    }

    public string Name { get; private set; } = string.Empty;

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Название категории не может быть пустым.",
                nameof(name));
        }

        Name = name.Trim();
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
