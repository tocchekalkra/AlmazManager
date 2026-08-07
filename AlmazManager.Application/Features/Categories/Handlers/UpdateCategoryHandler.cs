using AlmazManager.Application.Features.Categories.Commands;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class UpdateCategoryHandler
{
    private readonly ICategoryRepository _repository;

    public UpdateCategoryHandler(
        ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<CategoryResponse> HandleAsync(
        UpdateCategoryCommand command)
    {
        var category =
            await _repository.GetByIdAsync(
                command.CategoryId);

        if (category is null)
        {
            throw new InvalidOperationException(
                "Категория не найдена.");
        }

        if (await _repository.NameExistsAsync(
                command.Name,
                category.Id))
        {
            throw new InvalidOperationException(
                $"Категория '{command.Name}' уже существует.");
        }

        category.Rename(command.Name);

        await _repository.UpdateAsync(category);

        await _repository.SaveChangesAsync();

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}
