using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IUserPreferenceRepository
{
    Task<UserPreference?> GetByUserIdAsync(Guid userId);
    Task AddAsync(UserPreference preference);
    Task SaveChangesAsync();
}
