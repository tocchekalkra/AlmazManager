using AlmazManager.Application.Features.Categories.Commands;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class SetCategoryActivityHandler
{
    private readonly ICategoryRepository _categoryRepository;

    public SetCategoryActivityHandler(
        ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryResponse> HandleAsync(
        SetCategoryActivityCommand command)
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

        if (command.IsActive)
        {
            category.Restore();
        }
        else
        {
            category.Archive();
        }

        await _categoryRepository.UpdateAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}
