using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class SupplyInvoiceRepository : ISupplyInvoiceRepository
{
    private readonly WarehouseDbContext _db;

    public SupplyInvoiceRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public Task<SupplyInvoice?> GetByIdAsync(Guid id) =>
        _db.SupplyInvoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task<List<SupplyInvoice>> GetAllAsync() =>
        _db.SupplyInvoices
            .Include(x => x.Items)
            .OrderByDescending(x => x.InvoiceDate)
            .ThenByDescending(x => x.CreatedAtUtc)
            .ToListAsync();

    public Task<List<SupplyInvoice>> GetOpenAsync() =>
        _db.SupplyInvoices
            .Include(x => x.Items)
            .Where(x =>
                x.Status != SupplyInvoiceStatus.FullyReceived &&
                x.Status != SupplyInvoiceStatus.Cancelled)
            .ToListAsync();

    public async Task AddAsync(SupplyInvoice invoice) =>
        await _db.SupplyInvoices.AddAsync(invoice);

    public async Task SaveChangesAsync() =>
        await _db.SaveChangesAsync();
}
