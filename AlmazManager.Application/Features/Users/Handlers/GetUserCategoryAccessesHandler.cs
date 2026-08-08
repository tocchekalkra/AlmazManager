using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Users.Handlers;

public sealed class GetUserCategoryAccessesHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUserCategoryAccessRepository
        _accessRepository;

    public GetUserCategoryAccessesHandler(
        IUserRepository userRepository,
        ICategoryRepository categoryRepository,
        IUserCategoryAccessRepository accessRepository)
    {
        _userRepository = userRepository;
        _categoryRepository = categoryRepository;
        _accessRepository = accessRepository;
    }

    public async Task<List<UserCategoryAccessResponse>>
        HandleAsync(Guid userId)
    {
        var user =
            await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException(
                "Пользователь не найден.");

        var categories =
            await _categoryRepository.GetAllAsync();

        var existingAccesses =
            await _accessRepository.GetByUserIdAsync(userId);

        var accessMap =
            existingAccesses.ToDictionary(
                x => x.CategoryId);

        var isAdministrator =
            user.Role == UserRole.Administrator;

        return categories
            .OrderBy(x => x.Name)
            .Select(category =>
            {
                if (isAdministrator)
                {
                    return new UserCategoryAccessResponse(
                        category.Id,
                        category.Name,
                        true,
                        true,
                        true,
                        true);
                }

                if (accessMap.TryGetValue(
                        category.Id,
                        out var access))
                {
                    return new UserCategoryAccessResponse(
                        category.Id,
                        category.Name,
                        access.CanView,
                        access.CanReceive,
                        access.CanIssue,
                        access.CanInventory);
                }

                return new UserCategoryAccessResponse(
                    category.Id,
                    category.Name,
                    false,
                    false,
                    false,
                    false);
            })
            .ToList();
    }
}