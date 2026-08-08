using System.Security.Claims;
using AlmazManager.Application.Interfaces;

namespace AlmazManager.API.Services;

public sealed class CurrentUserService
    : ICurrentUserService
{
    private readonly IHttpContextAccessor
        _httpContextAccessor;

    public CurrentUserService(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor =
            httpContextAccessor;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor
            .HttpContext?
            .User?
            .Identity?
            .IsAuthenticated
        == true;

    public Guid UserId
    {
        get
        {
            var value =
                _httpContextAccessor
                    .HttpContext?
                    .User?
                    .FindFirstValue(
                        ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(
                    value,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Не удалось определить текущего пользователя.");
            }

            return userId;
        }
    }

    public string Role =>
        _httpContextAccessor
            .HttpContext?
            .User?
            .FindFirstValue(
                ClaimTypes.Role)
        ?? string.Empty;
}