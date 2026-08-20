using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using System.Globalization;
using System.Text.RegularExpressions;

namespace AlmazManager.Application.Services;

internal static class MaterialDisplayName
{
    public static string Format(Material material)
    {
        var name = material.WidthMeters.HasValue
            ? Regex.Replace(
                material.Name,
                @"\s+-?\s*\d+(?:[.,]\d+)?\s*м\s*$",
                string.Empty,
                RegexOptions.IgnoreCase).Trim()
            : material.Name;

        if (material.Kind == MaterialKind.Oracal641)
        {
            var color = string.Join(
                " ",
                new[] { material.ColorCode, material.ColorName }
                    .Where(value => !string.IsNullOrWhiteSpace(value)));

            if (!string.IsNullOrWhiteSpace(color) &&
                !name.Contains(color, StringComparison.OrdinalIgnoreCase))
            {
                name = $"{name} · {color}";
            }
        }

        if (material.Kind == MaterialKind.Ink)
        {
            var package = material.PackageLiters.HasValue
                ? $" · {material.PackageLiters.Value:0.##} л"
                : string.Empty;
            return $"{material.MachineName} · {material.ColorName}{package}";
        }

        if (!material.WidthMeters.HasValue)
        {
            return name;
        }

        var width = material.WidthMeters.Value.ToString(
            "0.##",
            CultureInfo.GetCultureInfo("ru-RU"));

        return $"{name} - {width} м";
    }
}
