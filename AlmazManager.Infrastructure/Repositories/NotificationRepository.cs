using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly WarehouseDbContext _db;

    public NotificationRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public Task<Notification?> GetByIdAsync(Guid id) =>
        _db.Notifications.FirstOrDefaultAsync(x => x.Id == id);

    public Task<List<Notification>> GetByUserIdAsync(Guid userId, bool unreadOnly = false)
    {
        var query = _db.Notifications.Where(x => x.UserId == userId);

        if (unreadOnly)
            query = query.Where(x => x.ReadAtUtc == null);

        return query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(200)
            .ToListAsync();
    }

    public Task<Notification?> GetActiveByKeyAsync(Guid userId, string deduplicationKey) =>
        _db.Notifications.FirstOrDefaultAsync(x =>
            x.UserId == userId &&
            x.DeduplicationKey == deduplicationKey &&
            x.ResolvedAtUtc == null);

    public Task<List<Notification>> GetActiveByMaterialIdAsync(Guid materialId) =>
        _db.Notifications
            .Where(x => x.MaterialId == materialId && x.ResolvedAtUtc == null)
            .ToListAsync();

    public async Task AddAsync(Notification notification) =>
        await _db.Notifications.AddAsync(notification);

    public async Task AddRangeAsync(IEnumerable<Notification> notifications) =>
        await _db.Notifications.AddRangeAsync(notifications);

    public async Task SaveChangesAsync() =>
        await _db.SaveChangesAsync();
}
