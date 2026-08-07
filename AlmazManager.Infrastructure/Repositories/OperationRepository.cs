using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class OperationRepository :
    IOperationRepository
{
    private readonly WarehouseDbContext _db;

    public OperationRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Operation?> GetByIdAsync(
        Guid id)
    {
        return await _db.Operations
            .FirstOrDefaultAsync(
                operation => operation.Id == id);
    }

    public async Task<List<Operation>> GetAllAsync()
    {
        return await _db.Operations
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
    {
        await _db.Operations.AddAsync(operation);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
