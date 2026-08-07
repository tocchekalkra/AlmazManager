using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IOperationRepository
{
    Task<Operation?> GetByIdAsync(Guid id);

    Task<List<Operation>> GetAllAsync();

    Task<List<Operation>> GetByMaterialIdAsync(
        Guid materialId);

    Task<List<Operation>> GetByDocumentIdAsync(
        Guid documentId);

    Task AddAsync(Operation operation);

    Task SaveChangesAsync();
}