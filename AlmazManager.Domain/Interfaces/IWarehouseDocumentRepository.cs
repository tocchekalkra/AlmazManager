using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IWarehouseDocumentRepository
{
    Task<WarehouseDocument?> GetByIdAsync(
        Guid id);

    Task<List<WarehouseDocument>> GetAllAsync();

    Task<int> ReserveNextNumberAsync(
        AlmazManager.Domain.Enums.WarehouseDocumentType type);

    Task AddAsync(
        WarehouseDocument document);

    Task DeleteAsync(
        WarehouseDocument document);

    Task SaveChangesAsync();
}
