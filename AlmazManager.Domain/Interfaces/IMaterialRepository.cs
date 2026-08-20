using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IMaterialRepository
{
    Task<Material?> GetByIdAsync(Guid id);

    Task<Material?> GetByArticleAsync(string article);

    Task<bool> ArticleExistsAsync(
        string article,
        Guid? excludeMaterialId = null);

    Task<List<Material>> GetAllAsync();

    Task<bool> HasAnyDependenciesAsync(Guid materialId);

    Task<int> CountOpenSupplyLinksAsync(Guid materialId);

    Task AddAsync(Material material);

    Task UpdateAsync(Material material);

    Task DeleteAsync(Material material);

    Task SaveChangesAsync();
}
