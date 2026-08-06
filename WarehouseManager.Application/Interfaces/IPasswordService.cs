using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Application.Interfaces;

public interface IPasswordService
{
    string HashPassword(
        AppUser user,
        string password);

    bool VerifyPassword(
        AppUser user,
        string passwordHash,
        string password);
}