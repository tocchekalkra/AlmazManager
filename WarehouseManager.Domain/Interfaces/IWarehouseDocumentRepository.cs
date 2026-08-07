using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IWarehouseDocumentRepository
{
    Task<WarehouseDocument?> GetByIdAsync(
        Guid id);

    Task<List<WarehouseDocument>> GetAllAsync();

    Task AddAsync(
        WarehouseDocument document);

    Task DeleteAsync(
        WarehouseDocument document);

    Task SaveChangesAsync();
}