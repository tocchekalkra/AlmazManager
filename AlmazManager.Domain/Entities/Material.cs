using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

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

        Kind = MaterialKind.Standard;
    }

    public string Name { get; private set; } =
        string.Empty;

    public string Article { get; private set; } =
        string.Empty;

    public Guid CategoryId { get; private set; }

    public MeasurementUnit Unit { get; private set; }

    public decimal MinimumQuantity { get; private set; }

    public MaterialKind Kind { get; private set; } =
        MaterialKind.Standard;

    /// <summary>
    /// Ширина материала в метрах.
    /// Например:
    /// 3.20 для баннера,
    /// 1.00 или 1.27 для Oracal 641.
    /// </summary>
    public decimal? WidthMeters { get; private set; }

    /// <summary>
    /// Код цвета ORAFOL.
    /// Например: 031, 070, 010.
    /// Используется только для Oracal 641.
    /// </summary>
    public string? ColorCode { get; private set; }

    /// <summary>
    /// Название цвета.
    /// Например: Red / Красный.
    /// </summary>
    public string? ColorName { get; private set; }

    /// <summary>
    /// Цвет для отображения в интерфейсе.
    /// Формат HEX, например #AF000B.
    /// </summary>
    public string? ColorHex { get; private set; }

    /// <summary>Название станка, к которому относится краска.</summary>
    public string? MachineName { get; private set; }

    /// <summary>Фасовка краски в литрах: 1 или 5.</summary>
    public decimal? PackageLiters { get; private set; }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Название материала не может быть пустым.",
                nameof(name));
        }

        Name = name.Trim();
    }

    public void ChangeArticle(string article)
    {
        if (string.IsNullOrWhiteSpace(article))
        {
            throw new ArgumentException(
                "Артикул материала не может быть пустым.",
                nameof(article));
        }

        Article = article.Trim();
    }

    public void ChangeCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Категория не указана.",
                nameof(categoryId));
        }

        CategoryId = categoryId;
    }

    public void ChangeUnit(MeasurementUnit unit)
    {
        Unit = unit;
    }

    public void ChangeMinimumQuantity(
        decimal minimumQuantity)
    {
        if (minimumQuantity < 0)
        {
            throw new ArgumentException(
                "Минимальный остаток не может быть отрицательным.");
        }

        MinimumQuantity = minimumQuantity;
    }

    public void ConfigureStandard(
        decimal? widthMeters)
    {
        ValidateWidth(widthMeters);

        Kind = MaterialKind.Standard;
        WidthMeters = widthMeters;

        ColorCode = null;
        ColorName = null;
        ColorHex = null;
        MachineName = null;
        PackageLiters = null;
    }

    public void ConfigureOracal641(
        decimal widthMeters,
        string colorCode,
        string colorName,
        string colorHex)
    {
        ValidateWidth(widthMeters);

        if (widthMeters != 1.00m &&
            widthMeters != 1.27m)
        {
            throw new ArgumentException(
                "Для Oracal 641 разрешены ширины 1,00 м и 1,27 м.",
                nameof(widthMeters));
        }

        if (string.IsNullOrWhiteSpace(colorCode))
        {
            throw new ArgumentException(
                "Код цвета Oracal не указан.",
                nameof(colorCode));
        }

        if (string.IsNullOrWhiteSpace(colorName))
        {
            throw new ArgumentException(
                "Название цвета Oracal не указано.",
                nameof(colorName));
        }

        if (!IsValidHexColor(colorHex))
        {
            throw new ArgumentException(
                "Цвет должен быть указан в формате HEX, например #AF000B.",
                nameof(colorHex));
        }

        Kind = MaterialKind.Oracal641;

        WidthMeters = widthMeters;

        ColorCode =
            colorCode.Trim();

        ColorName =
            colorName.Trim();

        ColorHex =
            colorHex.Trim().ToUpperInvariant();

        // Oracal учитывается в погонных метрах.
        Unit = MeasurementUnit.Meter;
        MachineName = null;
        PackageLiters = null;
    }

    public void ConfigureInk(
        string machineName,
        string colorName,
        decimal packageLiters,
        string? colorHex)
    {
        if (string.IsNullOrWhiteSpace(machineName))
            throw new ArgumentException("Для краски необходимо указать станок.", nameof(machineName));

        var allowedColors = new[] { "Cyan", "Magenta", "Yellow", "Black", "White" };
        var normalizedColor = allowedColors.FirstOrDefault(value =>
            string.Equals(value, colorName?.Trim(), StringComparison.OrdinalIgnoreCase));

        if (normalizedColor is null)
            throw new ArgumentException("Разрешены цвета Cyan, Magenta, Yellow, Black и White.", nameof(colorName));

        if (packageLiters != 1m && packageLiters != 5m)
            throw new ArgumentException("Для краски разрешена фасовка 1 л или 5 л.", nameof(packageLiters));

        if (!string.IsNullOrWhiteSpace(colorHex) && !IsValidHexColor(colorHex))
            throw new ArgumentException("Цвет должен быть указан в формате HEX, например #00AEEF.", nameof(colorHex));

        Kind = MaterialKind.Ink;
        Unit = MeasurementUnit.Liter;
        WidthMeters = null;
        ColorCode = normalizedColor;
        ColorName = normalizedColor;
        ColorHex = string.IsNullOrWhiteSpace(colorHex) ? DefaultInkHex(normalizedColor) : colorHex.Trim().ToUpperInvariant();
        MachineName = machineName.Trim();
        PackageLiters = packageLiters;
    }

    public void Archive()
    {
        IsActive = false;
    }

    public void Restore()
    {
        IsActive = true;
    }

    private static void ValidateWidth(
        decimal? widthMeters)
    {
        if (widthMeters.HasValue &&
            widthMeters.Value <= 0)
        {
            throw new ArgumentException(
                "Ширина материала должна быть больше нуля.",
                nameof(widthMeters));
        }
    }

    private static bool IsValidHexColor(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var hex =
            value.Trim();

        if (hex.Length != 7 ||
            hex[0] != '#')
        {
            return false;
        }

        return hex
            .Skip(1)
            .All(character =>
                Uri.IsHexDigit(character));
    }

    private static string DefaultInkHex(string colorName) => colorName switch
    {
        "Cyan" => "#00AEEF",
        "Magenta" => "#EC008C",
        "Yellow" => "#FFF200",
        "Black" => "#111111",
        "White" => "#F4F4F4",
        _ => "#808080"
    };
}
