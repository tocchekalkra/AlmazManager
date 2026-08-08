using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Services;

public sealed class CategoryAccessService
    : ICategoryAccessService
{
    private readonly ICurrentUserService
        _currentUserService;

    private readonly IUserCategoryAccessRepository
        _accessRepository;

    public CategoryAccessService(
        ICurrentUserService currentUserService,
        IUserCategoryAccessRepository accessRepository)
    {
        _currentUserService =
            currentUserService;

        _accessRepository =
            accessRepository;
    }

    public async Task<bool> HasAccessAsync(
        Guid categoryId,
        CategoryPermission permission)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            return false;
        }

        if (string.Equals(
                _currentUserService.Role,
                UserRole.Administrator.ToString(),
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var access =
            await _accessRepository
                .GetByUserAndCategoryAsync(
                    _currentUserService.UserId,
                    categoryId);

        if (access is null ||
            !access.IsActive)
        {
            return false;
        }

        return permission switch
        {
            CategoryPermission.View =>
                access.CanView,

            CategoryPermission.Receive =>
                access.CanReceive,

            CategoryPermission.Issue =>
                access.CanIssue,

            CategoryPermission.Inventory =>
                access.CanInventory,

            _ => false
        };
    }

    public async Task EnsureAccessAsync(
        Guid categoryId,
        CategoryPermission permission)
    {
        var hasAccess =
            await HasAccessAsync(
                categoryId,
                permission);

        if (hasAccess)
        {
            return;
        }

        throw new UnauthorizedAccessException(
            GetErrorMessage(permission));
    }

    public async Task<HashSet<Guid>?>
        GetAllowedCategoryIdsAsync(
            CategoryPermission permission)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            return new HashSet<Guid>();
        }

        if (string.Equals(
                _currentUserService.Role,
                UserRole.Administrator.ToString(),
                StringComparison.OrdinalIgnoreCase))
        {
            // null означает:
            // администратору разрешены все категории.
            return null;
        }

        var accesses =
            await _accessRepository
                .GetByUserIdAsync(
                    _currentUserService.UserId);

        return accesses
            .Where(access =>
                access.IsActive &&
                HasPermission(
                    access,
                    permission))
            .Select(access =>
                access.CategoryId)
            .ToHashSet();
    }

    private static bool HasPermission(
        Domain.Entities.UserCategoryAccess access,
        CategoryPermission permission)
    {
        return permission switch
        {
            CategoryPermission.View =>
                access.CanView,

            CategoryPermission.Receive =>
                access.CanReceive,

            CategoryPermission.Issue =>
                access.CanIssue,

            CategoryPermission.Inventory =>
                access.CanInventory,

            _ => false
        };
    }

    private static string GetErrorMessage(
        CategoryPermission permission)
    {
        return permission switch
        {
            CategoryPermission.View =>
                "У вас нет доступа к этой категории материалов.",

            CategoryPermission.Receive =>
                "У вас нет права выполнять приход для этой категории.",

            CategoryPermission.Issue =>
                "У вас нет права выполнять расход для этой категории.",

            CategoryPermission.Inventory =>
                "У вас нет права выполнять инвентаризацию этой категории.",

            _ =>
                "Недостаточно прав для выполнения операции."
        };
    }
}