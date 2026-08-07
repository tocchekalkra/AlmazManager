using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;
using WarehouseManager.Infrastructure.Database;

namespace WarehouseManager.Infrastructure.Repositories;

<<<<<<< HEAD
public sealed class OperationRepository : IOperationRepository
{
    private readonly WarehouseDbContext _db;

    public OperationRepository(WarehouseDbContext db)
=======
public sealed class OperationRepository :
    IOperationRepository
{
    private readonly WarehouseDbContext _db;

    public OperationRepository(
        WarehouseDbContext db)
>>>>>>> c287b0f (Update 07.08.26 14:30)
    {
        _db = db;
    }

<<<<<<< HEAD
    public async Task<Operation?> GetByIdAsync(Guid id)
    {
        return await _db.Operations
            .FirstOrDefaultAsync(operation => operation.Id == id);
=======
    public async Task<Operation?> GetByIdAsync(
        Guid id)
    {
        return await _db.Operations
            .FirstOrDefaultAsync(
                operation => operation.Id == id);
>>>>>>> c287b0f (Update 07.08.26 14:30)
    }

    public async Task<List<Operation>> GetAllAsync()
    {
        return await _db.Operations
<<<<<<< HEAD
            .OrderByDescending(operation => operation.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task AddAsync(Operation operation)
=======
            .OrderByDescending(
                operation => operation.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<List<Operation>> GetByMaterialIdAsync(
        Guid materialId)
    {
        return await _db.Operations
            .Where(operation =>
                operation.MaterialId == materialId)
            .OrderByDescending(operation =>
                operation.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<List<Operation>> GetByDocumentIdAsync(
        Guid documentId)
    {
        return await _db.Operations
            .Where(operation =>
                operation.DocumentId == documentId)
            .OrderByDescending(operation =>
                operation.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task AddAsync(
        Operation operation)
>>>>>>> c287b0f (Update 07.08.26 14:30)
    {
        await _db.Operations.AddAsync(operation);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}