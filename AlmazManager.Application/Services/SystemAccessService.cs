using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Services;

public sealed class SystemAccessService : ISystemAccessService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;

    public SystemAccessService(
        ICurrentUserService currentUserService,
        IUserRepository userRepository)
    {
        _currentUserService = currentUserService;
        _userRepository = userRepository;
    }

    public async Task<bool> HasAccessAsync(SystemPermission permission)
    {
        if (!_currentUserService.IsAuthenticated)
            return false;

        if (string.Equals(
                _currentUserService.Role,
                UserRole.Administrator.ToString(),
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var user = await _userRepository.GetByIdAsync(_currentUserService.UserId);

        if (user is null || !user.IsActive)
            return false;

        return permission switch
        {
            SystemPermission.ManageMaterials => user.CanManageMaterials,
            SystemPermission.ArchiveMaterials => user.CanArchiveMaterials,
            SystemPermission.RestoreMaterials => user.CanRestoreMaterials,
            SystemPermission.PermanentlyDeleteMaterials => user.CanPermanentlyDeleteMaterials,
            SystemPermission.CancelDocuments => user.CanCancelDocuments,
            SystemPermission.ManageSupplies => user.CanManageSupplies,
            _ => false
        };
    }

    public async Task EnsureAccessAsync(SystemPermission permission)
    {
        if (await HasAccessAsync(permission))
            return;

        throw new UnauthorizedAccessException(permission switch
        {
            SystemPermission.ManageMaterials => "У вас нет права создавать и редактировать материалы.",
            SystemPermission.ArchiveMaterials => "У вас нет права архивировать материалы.",
            SystemPermission.RestoreMaterials => "У вас нет права восстанавливать материалы.",
            SystemPermission.PermanentlyDeleteMaterials => "У вас нет права безвозвратно удалять материалы.",
            SystemPermission.CancelDocuments => "У вас нет права отменять проведённые документы.",
            SystemPermission.ManageSupplies => "У вас нет права работать со счетами и будущими поставками.",
            _ => "Недостаточно прав для выполнения операции."
        });
    }
}
