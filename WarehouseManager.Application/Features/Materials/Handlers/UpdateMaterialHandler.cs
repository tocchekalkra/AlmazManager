using WarehouseManager.Application.Features.Materials.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Materials.Handlers;

public sealed class UpdateMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;

    public UpdateMaterialHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<MaterialResponse> HandleAsync(
        UpdateMaterialCommand command)
    {
        if (command.MaterialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(command.MaterialId));
        }

        if (!Enum.TryParse<MeasurementUnit>(
                command.Unit,
                true,
                out var unit))
        {
            throw new ArgumentException(
                "Неизвестная единица измерения.",
                nameof(command.Unit));
        }

        var category =
            await _categoryRepository.GetByIdAsync(command.CategoryId);

        if (category is null)
        {
            throw new InvalidOperationException(
                "Категория не найдена.");
        }

        var material =
            await _materialRepository.GetByIdAsync(command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

        material.Rename(command.Name);
        material.ChangeArticle(command.Article);
        material.ChangeCategory(command.CategoryId);
        material.ChangeUnit(unit);
        material.ChangeMinimumQuantity(command.MinimumQuantity);

        await _materialRepository.UpdateAsync(material);
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