using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;
using WarehouseManager.Infrastructure.Database;

namespace WarehouseManager.Infrastructure.Repositories;

public sealed class CategoryRepository :
    ICategoryRepository
{
    private readonly WarehouseDbContext _db;

    public CategoryRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Category?> GetByIdAsync(
        Guid id)
    {
        return await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Category?> GetByNameAsync(
        string name)
    {
        var normalized = name.Trim().ToLower();

        return await _db.Categories
            .FirstOrDefaultAsync(x =>
                x.Name.ToLower() == normalized);
    }

    public async Task<bool> NameExistsAsync(
        string name,
        Guid? excludeCategoryId = null)
    {
        var normalized = name.Trim().ToLower();

        return await _db.Categories.AnyAsync(x =>
            x.Name.ToLower() == normalized &&
            (!excludeCategoryId.HasValue ||
             x.Id != excludeCategoryId.Value));
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _db.Categories
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task AddAsync(
        Category category)
    {
        await _db.Categories.AddAsync(category);
    }

    public Task UpdateAsync(
        Category category)
    {
        _db.Categories.Update(category);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        Category category)
    {
        _db.Categories.Remove(category);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}