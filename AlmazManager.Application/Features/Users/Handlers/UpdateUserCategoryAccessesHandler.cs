using AlmazManager.Contracts.Requests.Users;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Users.Handlers;

public sealed class UpdateUserCategoryAccessesHandler
{
    private readonly IUserRepository
        _userRepository;

    private readonly ICategoryRepository
        _categoryRepository;

    private readonly IUserCategoryAccessRepository
        _accessRepository;

    public UpdateUserCategoryAccessesHandler(
        IUserRepository userRepository,
        ICategoryRepository categoryRepository,
        IUserCategoryAccessRepository accessRepository)
    {
        _userRepository =
            userRepository;

        _categoryRepository =
            categoryRepository;

        _accessRepository =
            accessRepository;
    }

    public async Task HandleAsync(
        Guid userId,
        UpdateUserCategoryAccessesRequest request)
    {
        var user =
            await _userRepository
                .GetByIdAsync(userId)
            ?? throw new InvalidOperationException(
                "Пользователь не найден.");

        if (user.Role ==
            UserRole.Administrator)
        {
            throw new InvalidOperationException(
                "Права администратора нельзя ограничивать.");
        }

        var categories =
            await _categoryRepository
                .GetAllAsync();

        var categoryIds =
            categories
                .Select(x => x.Id)
                .ToHashSet();

        var duplicateCategories =
            request.Accesses
                .GroupBy(x => x.CategoryId)
                .Where(x => x.Count() > 1)
                .Select(x => x.Key)
                .ToList();

        if (duplicateCategories.Count > 0)
        {
            throw new InvalidOperationException(
                "Одна категория указана несколько раз.");
        }

        foreach (var requestedAccess in request.Accesses)
        {
            if (!categoryIds.Contains(
                    requestedAccess.CategoryId))
            {
                throw new InvalidOperationException(
                    "Одна из указанных категорий не существует.");
            }

            var existing =
                await _accessRepository
                    .GetByUserAndCategoryAsync(
                        userId,
                        requestedAccess.CategoryId);

            var hasAnyPermission =
                requestedAccess.CanView ||
                requestedAccess.CanReceive ||
                requestedAccess.CanIssue ||
                requestedAccess.CanInventoryStandard ||
                requestedAccess.CanInventoryOracal;

            if (!hasAnyPermission)
            {
                if (existing is not null)
                {
                    await _accessRepository
                        .DeleteAsync(existing);
                }

                continue;
            }

            /*
             * Любое рабочее право автоматически
             * подразумевает право просмотра категории.
             */
            var canView =
                requestedAccess.CanView ||
                requestedAccess.CanReceive ||
                requestedAccess.CanIssue ||
                requestedAccess.CanInventoryStandard ||
                requestedAccess.CanInventoryOracal;

            if (existing is null)
            {
                var access =
                    new UserCategoryAccess(
                        userId,
                        requestedAccess.CategoryId,
                        canView,
                        requestedAccess.CanReceive,
                        requestedAccess.CanIssue,
                        requestedAccess.CanInventoryStandard,
                        requestedAccess.CanInventoryOracal);

                await _accessRepository
                    .AddAsync(access);
            }
            else
            {
                existing.ChangePermissions(
                    canView,
                    requestedAccess.CanReceive,
                    requestedAccess.CanIssue,
                    requestedAccess.CanInventoryStandard,
                    requestedAccess.CanInventoryOracal);

                await _accessRepository
                    .UpdateAsync(existing);
            }
        }

        /*
         * Если категория вообще не пришла
         * в запросе — доступ к ней удаляем.
         */
        var requestedCategoryIds =
            request.Accesses
                .Select(x => x.CategoryId)
                .ToHashSet();

        var existingAccesses =
            await _accessRepository
                .GetByUserIdAsync(userId);

        foreach (var existing in existingAccesses)
        {
            if (!requestedCategoryIds.Contains(
                    existing.CategoryId))
            {
                await _accessRepository
                    .DeleteAsync(existing);
            }
        }

        await _accessRepository
            .SaveChangesAsync();
    }
}