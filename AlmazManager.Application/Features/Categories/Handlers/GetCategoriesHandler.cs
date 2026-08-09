using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class GetCategoriesHandler
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetCategoriesHandler(
        ICategoryRepository categoryRepository,
        ICategoryAccessService categoryAccessService)
    {
        _categoryRepository = categoryRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<List<CategoryResponse>> HandleAsync()
    {
        var categories =
            await _categoryRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            categories = categories
                .Where(category => allowedCategoryIds.Contains(category.Id))
                .ToList();
        }

        return categories
            .Select(x => new CategoryResponse(
                x.Id,
                x.Name,
                x.IsActive))
            .ToList();
    }
}
