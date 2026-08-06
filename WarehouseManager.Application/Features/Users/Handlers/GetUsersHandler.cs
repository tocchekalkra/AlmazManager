using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Users.Handlers;

public sealed class GetUsersHandler
{
    private readonly IUserRepository _userRepository;

    public GetUsersHandler(
        IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserResponse>> HandleAsync()
    {
        var users = await _userRepository.GetAllAsync();

        return users
            .Select(user => new UserResponse(
                user.Id,
                user.FullName,
                user.Login,
                user.Role.ToString(),
                user.IsActive,
                user.CreatedAtUtc))
            .ToList();
    }
}