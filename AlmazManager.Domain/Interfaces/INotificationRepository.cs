using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(Guid id);
    Task<List<Notification>> GetByUserIdAsync(Guid userId, bool unreadOnly = false);
    Task<Notification?> GetActiveByKeyAsync(Guid userId, string deduplicationKey);
    Task<List<Notification>> GetActiveByMaterialIdAsync(Guid materialId);
    Task AddAsync(Notification notification);
    Task AddRangeAsync(IEnumerable<Notification> notifications);
    Task SaveChangesAsync();
}
