using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(Guid id);

    Task<Category?> GetByNameAsync(string name);

    Task<bool> NameExistsAsync(
        string name,
        Guid? excludeCategoryId = null);

    Task<List<Category>> GetAllAsync();

    Task AddAsync(Category category);

    Task UpdateAsync(Category category);

    Task DeleteAsync(Category category);

    Task SaveChangesAsync();
}
