using WarehouseManager.Application.Features.Categories.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Categories.Handlers;

public sealed class UpdateCategoryHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public UpdateCategoryHandler(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryResponse> HandleAsync(
        UpdateCategoryCommand command)
    {
        if (command.CategoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Категория не указана.",
                nameof(command.CategoryId));
        }

        var category =
            await _categoryRepository.GetByIdAsync(command.CategoryId);

        if (category is null)
        {
            throw new InvalidOperationException(
                "Категория не найдена.");
        }

        category.Rename(command.Name);

        await _categoryRepository.UpdateAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}