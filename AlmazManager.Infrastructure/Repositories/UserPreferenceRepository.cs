using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;
using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace AlmazManager.Infrastructure.Repositories;

public sealed class UserPreferenceRepository : IUserPreferenceRepository
{
    private readonly WarehouseDbContext _db;

    public UserPreferenceRepository(WarehouseDbContext db)
    {
        _db = db;
    }

    public Task<UserPreference?> GetByUserIdAsync(Guid userId) =>
        _db.UserPreferences.FirstOrDefaultAsync(x => x.UserId == userId);

    public async Task AddAsync(UserPreference preference) =>
        await _db.UserPreferences.AddAsync(preference);

    public async Task SaveChangesAsync() =>
        await _db.SaveChangesAsync();
}
