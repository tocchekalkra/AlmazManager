using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class UpdateMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ISystemAccessService _systemAccessService;
    private readonly ICategoryAccessService _categoryAccessService;

    public UpdateMaterialHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        ISystemAccessService systemAccessService,
        ICategoryAccessService categoryAccessService)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
        _systemAccessService = systemAccessService;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<MaterialResponse> HandleAsync(
        UpdateMaterialCommand command)
    {
        await _systemAccessService.EnsureAccessAsync(SystemPermission.ManageMaterials);

        var material =
            await _materialRepository.GetByIdAsync(
                command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            material.CategoryId,
            CategoryPermission.View);

        var category =
            await _categoryRepository.GetByIdAsync(
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

        if (await _materialRepository.ArticleExistsAsync(
                command.Article,
                material.Id))
        {
            throw new InvalidOperationException(
                $"Другой материал уже использует артикул '{command.Article}'.");
        }

        material.Rename(
            command.Name);

        material.ChangeArticle(
            command.Article);

        material.ChangeCategory(
            command.CategoryId);

        material.ChangeUnit(
            unit);

        material.ChangeMinimumQuantity(
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
                command.ColorCode ?? string.Empty,
                command.ColorName ?? string.Empty,
                command.ColorHex ?? string.Empty);
        }
        else if (kind == MaterialKind.Ink)
        {
            material.ConfigureInk(
                command.MachineName ?? string.Empty,
                command.ColorName ?? command.ColorCode ?? string.Empty,
                command.PackageLiters ?? 0,
                command.ColorHex);
        }
        else
        {
            material.ConfigureStandard(
                command.WidthMeters);
        }

        await _materialRepository.UpdateAsync(
            material);

        await _materialRepository.SaveChangesAsync();

        return new MaterialResponse(
            material.Id,
            material.Name,
            material.Article,
            material.CategoryId,
            material.MinimumQuantity,
            material.Unit.ToString(),
            material.IsActive);
    }
}
