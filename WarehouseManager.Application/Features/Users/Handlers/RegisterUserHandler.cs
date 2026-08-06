using WarehouseManager.Application.Features.Users.Commands;
using WarehouseManager.Application.Interfaces;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Users.Handlers;

public sealed class RegisterUserHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordService _passwordService;

    public RegisterUserHandler(
        IUserRepository userRepository,
        IPasswordService passwordService)
    {
        _userRepository = userRepository;
        _passwordService = passwordService;
    }

    public async Task<UserResponse> HandleAsync(
        RegisterUserCommand command)
    {
        if (!Enum.TryParse<UserRole>(
                command.Role,
                true,
                out var role))
        {
            throw new ArgumentException(
                "Неизвестная роль пользователя.",
                nameof(command.Role));
        }

        var existingUser =
            await _userRepository.GetByLoginAsync(command.Login);

        if (existingUser is not null)
        {
            throw new InvalidOperationException(
                "Пользователь с таким логином уже существует.");
        }

        var user = new AppUser(
            command.FullName,
            command.Login,
            role);

        var passwordHash = _passwordService.HashPassword(
            user,
            command.Password);

        user.ChangePasswordHash(passwordHash);

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return new UserResponse(
            user.Id,
            user.FullName,
            user.Login,
            user.Role.ToString(),
            user.IsActive,
            user.CreatedAtUtc);
    }
}