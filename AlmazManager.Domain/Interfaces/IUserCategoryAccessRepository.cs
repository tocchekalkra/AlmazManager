using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IUserCategoryAccessRepository
{
    Task<List<UserCategoryAccess>> GetByUserIdAsync(Guid userId);

    Task<List<UserCategoryAccess>> GetByCategoryIdAsync(Guid categoryId);

    Task<UserCategoryAccess?> GetByUserAndCategoryAsync(
        Guid userId,
        Guid categoryId);

    Task AddAsync(UserCategoryAccess access);

    Task UpdateAsync(UserCategoryAccess access);

    Task DeleteAsync(UserCategoryAccess access);

    Task SaveChangesAsync();
}
