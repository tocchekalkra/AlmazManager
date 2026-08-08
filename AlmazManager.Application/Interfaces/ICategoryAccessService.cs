using AlmazManager.Application.Security;

namespace AlmazManager.Application.Interfaces;

public interface ICategoryAccessService
{
    Task<bool> HasAccessAsync(
        Guid categoryId,
        CategoryPermission permission);

    Task EnsureAccessAsync(
        Guid categoryId,
        CategoryPermission permission);

    Task<HashSet<Guid>?> GetAllowedCategoryIdsAsync(
        CategoryPermission permission);
}