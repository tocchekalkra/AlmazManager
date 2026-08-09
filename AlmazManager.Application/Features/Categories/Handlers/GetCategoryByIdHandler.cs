using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class GetCategoryByIdHandler
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetCategoryByIdHandler(
        ICategoryRepository categoryRepository,
        ICategoryAccessService categoryAccessService)
    {
        _categoryRepository = categoryRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<CategoryResponse?> HandleAsync(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Категория не указана.",
                nameof(categoryId));
        }

        var category =
            await _categoryRepository.GetByIdAsync(categoryId);

        if (category is null)
        {
            return null;
        }

        if (!await _categoryAccessService.HasAccessAsync(
                category.Id,
                CategoryPermission.View))
        {
            return null;
        }

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}
