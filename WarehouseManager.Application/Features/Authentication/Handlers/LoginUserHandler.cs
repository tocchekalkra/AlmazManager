using Microsoft.Extensions.Options;
using WarehouseManager.Application.Features.Authentication.Commands;
using WarehouseManager.Application.Interfaces;
using WarehouseManager.Application.Options;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Authentication.Handlers;

public sealed class LoginUserHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordService _passwordService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly JwtOptions _jwtOptions;

    public LoginUserHandler(
        IUserRepository userRepository,
        IPasswordService passwordService,
        IJwtTokenService jwtTokenService,
        IOptions<JwtOptions> jwtOptions)
    {
        _userRepository = userRepository;
        _passwordService = passwordService;
        _jwtTokenService = jwtTokenService;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<LoginResponse> HandleAsync(
        LoginUserCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Login))
        {
            throw new ArgumentException(
                "Логин не указан.",
                nameof(command.Login));
        }

        if (string.IsNullOrWhiteSpace(command.Password))
        {
            throw new ArgumentException(
                "Пароль не указан.",
                nameof(command.Password));
        }

        var user = await _userRepository.GetByLoginAsync(
            command.Login);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Неверный логин или пароль.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException(
                "Пользователь заблокирован.");
        }

        var passwordIsValid =
            _passwordService.VerifyPassword(
                user,
                user.PasswordHash,
                command.Password);

        if (!passwordIsValid)
        {
            throw new InvalidOperationException(
                "Неверный логин или пароль.");
        }

        var expiresAtUtc = DateTime.UtcNow.AddHours(
            _jwtOptions.ExpirationHours);

        var accessToken = _jwtTokenService.CreateToken(
            user,
            expiresAtUtc);

        return new LoginResponse(
            accessToken,
            "Bearer",
            expiresAtUtc,
            user.Id,
            user.FullName,
            user.Login,
            user.Role.ToString());
    }
}