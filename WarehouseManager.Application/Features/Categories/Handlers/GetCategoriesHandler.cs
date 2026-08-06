using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Categories.Handlers;

public sealed class GetCategoriesHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public GetCategoriesHandler(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryResponse>> HandleAsync()
    {
        var categories =
            await _categoryRepository.GetAllAsync();

        return categories
            .Select(x => new CategoryResponse(
                x.Id,
                x.Name,
                x.IsActive))
            .ToList();
    }
}