using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class CreateMaterialHandler
{
    private readonly IMaterialRepository
        _materialRepository;

    private readonly ICategoryRepository
        _categoryRepository;

    private readonly ISystemAccessService
        _systemAccessService;

    private readonly ICategoryAccessService
        _categoryAccessService;

    public CreateMaterialHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        ISystemAccessService systemAccessService,
        ICategoryAccessService categoryAccessService)
    {
        _materialRepository =
            materialRepository;

        _categoryRepository =
            categoryRepository;

        _systemAccessService = systemAccessService;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<MaterialResponse> HandleAsync(
        CreateMaterialCommand command)
    {
        await _systemAccessService.EnsureAccessAsync(SystemPermission.ManageMaterials);

        if (!Enum.TryParse<MeasurementUnit>(
                command.Unit,
                true,
                out var unit))
        {
            throw new ArgumentException(
                "Неизвестная единица измерения.");
        }

        if (!Enum.IsDefined(unit))
        {
            throw new ArgumentException(
                "Неизвестная единица измерения.");
        }

        if (!Enum.TryParse<MaterialKind>(
                command.Kind,
                true,
                out var kind))
        {
            throw new ArgumentException(
                "Неизвестный тип материала.");
        }

        if (!Enum.IsDefined(kind))
        {
            throw new ArgumentException(
                "Неизвестный тип материала.");
        }

        var category =
            await _categoryRepository
                .GetByIdAsync(
                    command.CategoryId);

        if (category is null)
        {
            throw new InvalidOperationException(
                "Категория не найдена.");
        }

        if (!category.IsActive)
        {
            throw new InvalidOperationException(
                $"Категория '{category.Name}' находится в архиве.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            category.Id,
            CategoryPermission.View);

        if (await _materialRepository
                .ArticleExistsAsync(
                    command.Article))
        {
            throw new InvalidOperationException(
                $"Материал с артикулом '{command.Article}' уже существует.");
        }

        var material =
            new Material(
                command.Name,
                command.Article,
                command.CategoryId,
                unit,
                command.MinimumQuantity);

        if (kind == MaterialKind.Oracal641)
        {
            if (!command.WidthMeters.HasValue)
            {
                throw new ArgumentException(
                    "Для Oracal 641 необходимо указать ширину.");
            }

            material.ConfigureOracal641(
                command.WidthMeters.Value,
                command.ColorCode ??
                string.Empty,
                command.ColorName ??
                string.Empty,
                command.ColorHex ??
                string.Empty);
        }
        else
        {
            material.ConfigureStandard(
                command.WidthMeters);
        }

        await _materialRepository
            .AddAsync(material);

        await _materialRepository
            .SaveChangesAsync();

        return ToResponse(material);
    }

    public async Task<List<MaterialResponse>>
        HandleBulkStandardAsync(
            CreateBulkStandardMaterialsCommand command)
    {
        await _systemAccessService.EnsureAccessAsync(SystemPermission.ManageMaterials);

        var name =
            command.Name.Trim();

        var articlePrefix =
            command.ArticlePrefix
                .Trim()
                .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Название материала не может быть пустым.");
        }

        if (string.IsNullOrWhiteSpace(
                articlePrefix))
        {
            throw new ArgumentException(
                "Префикс артикула не может быть пустым.");
        }

        if (command.MinimumQuantity < 0)
        {
            throw new ArgumentException(
                "Минимальный остаток не может быть отрицательным.");
        }

        if (command.Widths is null ||
            command.Widths.Count == 0)
        {
            throw new ArgumentException(
                "Необходимо выбрать хотя бы одну ширину.");
        }

        var normalizedWidths =
            command.Widths
                .Select(width =>
                    decimal.Round(
                        width,
                        2,
                        MidpointRounding.AwayFromZero))
                .ToList();

        if (normalizedWidths.Any(
                width => width <= 0))
        {
            throw new ArgumentException(
                "Все ширины должны быть больше нуля.");
        }

        if (normalizedWidths.Count !=
            normalizedWidths
                .Distinct()
                .Count())
        {
            throw new ArgumentException(
                "Список ширин содержит повторяющиеся значения.");
        }

        var category =
            await _categoryRepository
                .GetByIdAsync(
                    command.CategoryId);

        if (category is null)
        {
            throw new InvalidOperationException(
                "Категория не найдена.");
        }

        if (!category.IsActive)
        {
            throw new InvalidOperationException(
                $"Категория '{category.Name}' находится в архиве.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            category.Id,
            CategoryPermission.View);

        var items =
            normalizedWidths
                .OrderByDescending(
                    width => width)
                .Select(width =>
                    new BulkMaterialItem(
                        width,
                        BuildArticle(
                            articlePrefix,
                            width)))
                .ToList();

        /*
         * Сначала проверяем ВСЮ группу.
         * До AddAsync здесь ничего не добавляется.
         */
        foreach (var item in items)
        {
            if (await _materialRepository
                    .ArticleExistsAsync(
                        item.Article))
            {
                throw new InvalidOperationException(
                    $"Материал с артикулом '{item.Article}' уже существует. " +
                    "Группа не была создана.");
            }
        }

        var createdMaterials =
            new List<Material>();

        foreach (var item in items)
        {
            var material =
                new Material(
                    name,
                    item.Article,
                    command.CategoryId,
                    MeasurementUnit.Piece,
                    command.MinimumQuantity);

            material.ConfigureStandard(
                item.Width);

            await _materialRepository
                .AddAsync(material);

            createdMaterials.Add(
                material);
        }

        /*
         * Один SaveChanges для всей группы.
         * EF Core сохранит изменения одной транзакцией.
         */
        await _materialRepository
            .SaveChangesAsync();

        return createdMaterials
            .Select(ToResponse)
            .ToList();
    }

    private static string BuildArticle(
        string prefix,
        decimal width)
    {
        /*
         * 3.20 -> 320
         * 2.50 -> 250
         * 1.60 -> 160
         * 1.37 -> 137
         * 1.05 -> 105
         * 1.00 -> 100
         */
        var widthCode =
            decimal.ToInt32(
                decimal.Round(
                    width * 100m,
                    0,
                    MidpointRounding.AwayFromZero));

        return $"{prefix}-{widthCode}";
    }

    private static MaterialResponse ToResponse(
        Material material)
    {
        return new MaterialResponse(
            material.Id,
            material.Name,
            material.Article,
            material.CategoryId,
            material.MinimumQuantity,
            material.Unit.ToString(),
            material.IsActive);
    }

    private sealed record BulkMaterialItem(
        decimal Width,
        string Article);
}
