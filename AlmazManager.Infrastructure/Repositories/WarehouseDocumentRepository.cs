using System.Data;
using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class WarehouseDocumentRepository :
    IWarehouseDocumentRepository
{
    private readonly WarehouseDbContext _db;

    public WarehouseDocumentRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<WarehouseDocument?> GetByIdAsync(
        Guid id)
    {
        return await _db.WarehouseDocuments
            .Include(x => x.Items)
            .FirstOrDefaultAsync(
                x => x.Id == id);
    }

    public async Task<List<WarehouseDocument>> GetAllAsync()
    {
        return await _db.WarehouseDocuments
            .Include(x => x.Items)
            .OrderByDescending(
                x => x.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<int> ReserveNextNumberAsync(
        AlmazManager.Domain.Enums.WarehouseDocumentType type)
    {
        await using var transaction =
            await _db.Database.BeginTransactionAsync(
                IsolationLevel.Serializable);

        var sequence =
            await _db.WarehouseDocumentSequences
                .FirstOrDefaultAsync(x => x.Type == type);

        if (sequence is null)
        {
            sequence = new WarehouseDocumentSequence(type);
            await _db.WarehouseDocumentSequences.AddAsync(sequence);
        }

        var number = sequence.TakeNext();
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return number;
    }

    public async Task AddAsync(
        WarehouseDocument document)
    {
        await _db.WarehouseDocuments
            .AddAsync(document);
    }

    public Task DeleteAsync(
        WarehouseDocument document)
    {
        _db.WarehouseDocuments.Remove(
            document);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
