using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class StockRepository : IStockRepository
{
    private readonly WarehouseDbContext _db;

    public StockRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Stock?> GetByIdAsync(Guid id)
    {
        return await _db.Stocks
            .FirstOrDefaultAsync(stock => stock.Id == id);
    }

    public async Task<Stock?> GetByMaterialIdAsync(Guid materialId)
    {
        return await _db.Stocks
            .FirstOrDefaultAsync(
                stock => stock.MaterialId == materialId);
    }

    public async Task<List<Stock>> GetAllAsync()
    {
        return await _db.Stocks
            .OrderBy(stock => stock.MaterialId)
            .ToListAsync();
    }

    public async Task AddAsync(Stock stock)
    {
        await _db.Stocks.AddAsync(stock);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
