using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class UserCategoryAccessRepository
    : IUserCategoryAccessRepository
{
    private readonly WarehouseDbContext _db;

    public UserCategoryAccessRepository(
        WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserCategoryAccess>>
        GetByUserIdAsync(Guid userId)
    {
        return await _db.UserCategoryAccesses
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CategoryId)
            .ToListAsync();
    }

    public async Task<UserCategoryAccess?>
        GetByUserAndCategoryAsync(
            Guid userId,
            Guid categoryId)
    {
        return await _db.UserCategoryAccesses
            .FirstOrDefaultAsync(
                x =>
                    x.UserId == userId &&
                    x.CategoryId == categoryId);
    }

    public async Task AddAsync(
        UserCategoryAccess access)
    {
        await _db.UserCategoryAccesses.AddAsync(access);
    }

    public Task UpdateAsync(
        UserCategoryAccess access)
    {
        _db.UserCategoryAccesses.Update(access);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        UserCategoryAccess access)
    {
        _db.UserCategoryAccesses.Remove(access);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}