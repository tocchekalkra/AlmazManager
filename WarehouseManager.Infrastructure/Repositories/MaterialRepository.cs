using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;
using WarehouseManager.Infrastructure.Database;

namespace WarehouseManager.Infrastructure.Repositories;

public sealed class MaterialRepository : IMaterialRepository
{
    private readonly WarehouseDbContext _db;

    public MaterialRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Material?> GetByIdAsync(Guid id)
    {
        return await _db.Materials
            .FirstOrDefaultAsync(material => material.Id == id);
    }

    public async Task<List<Material>> GetAllAsync()
    {
        return await _db.Materials
            .OrderBy(material => material.Name)
            .ToListAsync();
    }

    public async Task AddAsync(Material material)
    {
        await _db.Materials.AddAsync(material);
    }

    public Task UpdateAsync(Material material)
    {
        _db.Materials.Update(material);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Material material)
    {
        _db.Materials.Remove(material);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}