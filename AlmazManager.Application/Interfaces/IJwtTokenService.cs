using AlmazManager.Domain.Entities;

namespace AlmazManager.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateToken(
        AppUser user,
        DateTime expiresAtUtc);
}
