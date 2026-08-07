using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

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
