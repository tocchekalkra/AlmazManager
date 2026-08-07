using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IInventoryDocumentRepository
{
    Task<InventoryDocument?> GetByIdAsync(Guid id);

    Task<List<InventoryDocument>> GetAllAsync();

    Task AddAsync(InventoryDocument document);

    Task DeleteAsync(InventoryDocument document);

    Task SaveChangesAsync();
}