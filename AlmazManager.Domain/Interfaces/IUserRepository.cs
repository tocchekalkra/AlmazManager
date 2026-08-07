using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IUserRepository
{
    Task<AppUser?> GetByIdAsync(Guid id);

    Task<AppUser?> GetByLoginAsync(string login);

    Task<List<AppUser>> GetAllAsync();

    Task AddAsync(AppUser user);

    Task UpdateAsync(AppUser user);

    Task SaveChangesAsync();
}
