using WarehouseManager.Application.Features.Materials.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Materials.Handlers;

public sealed class CreateMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;

    public CreateMaterialHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<MaterialResponse> HandleAsync(
        CreateMaterialCommand command)
    {
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

        if (await _materialRepository.ArticleExistsAsync(
                command.Article))
        {
            throw new InvalidOperationException(
                $"Материал с артикулом '{command.Article}' уже существует.");
        }

        var material = new Material(
            command.Name,
            command.Article,
            command.CategoryId,
            unit,
            command.MinimumQuantity);

        await _materialRepository.AddAsync(
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