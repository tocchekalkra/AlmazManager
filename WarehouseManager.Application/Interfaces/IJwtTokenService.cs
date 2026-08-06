using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateToken(
        AppUser user,
        DateTime expiresAtUtc);
}