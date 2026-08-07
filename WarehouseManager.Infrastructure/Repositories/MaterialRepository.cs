using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;
using WarehouseManager.Infrastructure.Database;

namespace WarehouseManager.Infrastructure.Repositories;

public sealed class MaterialRepository :
    IMaterialRepository
{
    private readonly WarehouseDbContext _db;

    public MaterialRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Material?> GetByIdAsync(
        Guid id)
    {
        return await _db.Materials
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Material?> GetByArticleAsync(
        string article)
    {
        var normalized = article.Trim().ToLower();

        return await _db.Materials
            .FirstOrDefaultAsync(x =>
                x.Article.ToLower() == normalized);
    }

    public async Task<bool> ArticleExistsAsync(
        string article,
        Guid? excludeMaterialId = null)
    {
        var normalized = article.Trim().ToLower();

        return await _db.Materials.AnyAsync(x =>
            x.Article.ToLower() == normalized &&
            (!excludeMaterialId.HasValue ||
             x.Id != excludeMaterialId.Value));
    }

    public async Task<List<Material>> GetAllAsync()
    {
        return await _db.Materials
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task AddAsync(
        Material material)
    {
        await _db.Materials.AddAsync(material);
    }

    public Task UpdateAsync(
        Material material)
    {
        _db.Materials.Update(material);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        Material material)
    {
        _db.Materials.Remove(material);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}