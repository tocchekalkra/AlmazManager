using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

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
        var material =
            await _materialRepository.GetByIdAsync(
                command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

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

        if (await _materialRepository.ArticleExistsAsync(
                command.Article,
                material.Id))
        {
            throw new InvalidOperationException(
                $"Другой материал уже использует артикул '{command.Article}'.");
        }

        material.Rename(command.Name);

        material.ChangeArticle(
            command.Article);

        material.ChangeCategory(
            command.CategoryId);

        material.ChangeUnit(unit);

        material.ChangeMinimumQuantity(
            command.MinimumQuantity);

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
