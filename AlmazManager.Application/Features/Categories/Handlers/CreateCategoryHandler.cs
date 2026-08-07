using AlmazManager.Application.Features.Categories.Commands;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class CreateCategoryHandler
{
    private readonly ICategoryRepository _repository;

    public CreateCategoryHandler(
        ICategoryRepository repository)
    {
        _repository = repository;
    }

    public async Task<CategoryResponse> HandleAsync(
        CreateCategoryCommand command)
    {
        if (await _repository.NameExistsAsync(
                command.Name))
        {
            throw new InvalidOperationException(
                $"Категория '{command.Name}' уже существует.");
        }

        var category =
            new Category(command.Name);

        await _repository.AddAsync(category);

        await _repository.SaveChangesAsync();

        return new CategoryResponse(
            category.Id,
            category.Name,
            category.IsActive);
    }
}
