using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class InventoryDocumentRepository :
    IInventoryDocumentRepository
{
    private readonly WarehouseDbContext _db;

    public InventoryDocumentRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<InventoryDocument?> GetByIdAsync(
        Guid id)
    {
        return await _db.InventoryDocuments
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<InventoryDocument>> GetAllAsync()
    {
        return await _db.InventoryDocuments
            .Include(x => x.Items)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task AddAsync(
        InventoryDocument document)
    {
        await _db.InventoryDocuments
            .AddAsync(document);
    }

    public Task DeleteAsync(
        InventoryDocument document)
    {
        _db.InventoryDocuments.Remove(document);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
