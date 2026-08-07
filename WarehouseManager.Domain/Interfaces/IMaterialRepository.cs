using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IMaterialRepository
{
    Task<Material?> GetByIdAsync(Guid id);

    Task<Material?> GetByArticleAsync(string article);

    Task<bool> ArticleExistsAsync(
        string article,
        Guid? excludeMaterialId = null);

    Task<List<Material>> GetAllAsync();

    Task AddAsync(Material material);

    Task UpdateAsync(Material material);

    Task DeleteAsync(Material material);

    Task SaveChangesAsync();
}