using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WarehouseManager.Application.Interfaces;
using WarehouseManager.Application.Options;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Identity;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(
        IOptions<JwtOptions> options)
    {
        _options = options.Value;

        ValidateOptions(_options);
    }

    public string CreateToken(
        AppUser user,
        DateTime expiresAtUtc)
    {
        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                user.Id.ToString()),

            new(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()),

            new(
                ClaimTypes.Name,
                user.FullName),

            new(
                ClaimTypes.Role,
                user.Role.ToString()),

            new(
                "login",
                user.Login),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString())
        };

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_options.SecretKey));

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    private static void ValidateOptions(JwtOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Issuer))
        {
            throw new InvalidOperationException(
                "В настройках JWT не указан Issuer.");
        }

        if (string.IsNullOrWhiteSpace(options.Audience))
        {
            throw new InvalidOperationException(
                "В настройках JWT не указан Audience.");
        }

        if (string.IsNullOrWhiteSpace(options.SecretKey)
            || options.SecretKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Секретный ключ JWT должен содержать минимум 32 символа.");
        }

        if (options.ExpirationHours < 1)
        {
            throw new InvalidOperationException(
                "Срок действия JWT должен быть больше нуля.");
        }
    }
}