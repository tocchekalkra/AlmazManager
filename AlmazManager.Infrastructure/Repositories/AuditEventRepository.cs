using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class AuditEventRepository : IAuditEventRepository
{
    private readonly WarehouseDbContext _db;

    public AuditEventRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public Task<List<AuditEvent>> GetAllAsync() =>
        _db.AuditEvents
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync();

    public async Task AddAsync(AuditEvent auditEvent) =>
        await _db.AuditEvents.AddAsync(auditEvent);

    public async Task SaveChangesAsync() =>
        await _db.SaveChangesAsync();
}
