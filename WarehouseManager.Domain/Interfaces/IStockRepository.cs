using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IStockRepository
{
    Task<Stock?> GetByIdAsync(Guid id);

    Task<Stock?> GetByMaterialIdAsync(Guid materialId);

    Task<List<Stock>> GetAllAsync();

    Task AddAsync(Stock stock);

    Task SaveChangesAsync();
}