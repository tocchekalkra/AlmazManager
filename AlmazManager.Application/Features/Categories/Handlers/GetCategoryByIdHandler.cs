using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class GetCategoryByIdHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public GetCategoryByIdHandler(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
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

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}
