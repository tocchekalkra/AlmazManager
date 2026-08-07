using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Domain.Interfaces;

public interface IOperationRepository
{
    Task<Operation?> GetByIdAsync(Guid id);

    Task<List<Operation>> GetAllAsync();

<<<<<<< HEAD
=======
    Task<List<Operation>> GetByMaterialIdAsync(
        Guid materialId);

    Task<List<Operation>> GetByDocumentIdAsync(
        Guid documentId);

>>>>>>> c287b0f (Update 07.08.26 14:30)
    Task AddAsync(Operation operation);

    Task SaveChangesAsync();
}