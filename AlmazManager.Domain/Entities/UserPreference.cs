using System.Text.Json;
using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class UserPreference : BaseEntity
{
    private UserPreference()
    {
    }

    public UserPreference(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("Пользователь не указан.", nameof(userId));
        }

        UserId = userId;
    }

    public Guid UserId { get; private set; }

    public UserTheme Theme { get; private set; } = UserTheme.System;

    public string MaterialOrderJson { get; private set; } = "[]";

    public string CategoryOrderJson { get; private set; } = "[]";

    public IReadOnlyList<Guid> MaterialOrder => Deserialize(MaterialOrderJson);

    public IReadOnlyList<Guid> CategoryOrder => Deserialize(CategoryOrderJson);

    public void ChangeTheme(UserTheme theme)
    {
        if (!Enum.IsDefined(theme))
        {
            throw new ArgumentOutOfRangeException(nameof(theme));
        }

        Theme = theme;
    }

    public void ChangeMaterialOrder(IEnumerable<Guid> materialIds)
    {
        MaterialOrderJson = Serialize(materialIds);
    }

    public void ChangeCategoryOrder(IEnumerable<Guid> categoryIds)
    {
        CategoryOrderJson = Serialize(categoryIds);
    }

    public void ResetOrder()
    {
        MaterialOrderJson = "[]";
        CategoryOrderJson = "[]";
    }

    private static string Serialize(IEnumerable<Guid> ids)
    {
        var values = ids
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        return JsonSerializer.Serialize(values);
    }

    private static IReadOnlyList<Guid> Deserialize(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
