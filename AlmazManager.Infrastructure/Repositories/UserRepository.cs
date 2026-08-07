using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly WarehouseDbContext _db;

    public UserRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<AppUser?> GetByIdAsync(Guid id)
    {
        return await _db.Users
            .FirstOrDefaultAsync(user => user.Id == id);
    }

    public async Task<AppUser?> GetByLoginAsync(string login)
    {
        var normalizedLogin = login.Trim().ToLowerInvariant();

        return await _db.Users
            .FirstOrDefaultAsync(
                user => user.Login == normalizedLogin);
    }

    public async Task<List<AppUser>> GetAllAsync()
    {
        return await _db.Users
            .OrderBy(user => user.FullName)
            .ToListAsync();
    }

    public async Task AddAsync(AppUser user)
    {
        await _db.Users.AddAsync(user);
    }

    public Task UpdateAsync(AppUser user)
    {
        _db.Users.Update(user);

        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
