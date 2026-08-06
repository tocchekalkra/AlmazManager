using WarehouseManager.Application.Features.Categories.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Categories.Handlers;

public sealed class CreateCategoryHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public CreateCategoryHandler(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryResponse> HandleAsync(
        CreateCategoryCommand command)
    {
        var category = new Category(command.Name);

        await _categoryRepository.AddAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}