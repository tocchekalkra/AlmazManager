using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;
using WarehouseManager.Infrastructure.Database;

namespace WarehouseManager.Infrastructure.Repositories;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly WarehouseDbContext _db;

    public CategoryRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Category?> GetByIdAsync(Guid id)
    {
        return await _db.Categories
            .FirstOrDefaultAsync(category => category.Id == id);
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _db.Categories
            .OrderBy(category => category.Name)
            .ToListAsync();
    }

    public async Task AddAsync(Category category)
    {
        await _db.Categories.AddAsync(category);
    }

    public Task UpdateAsync(Category category)
    {
        _db.Categories.Update(category);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Category category)
    {
        _db.Categories.Remove(category);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}