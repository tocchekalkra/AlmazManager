using AlmazManager.Contracts.Requests.Users;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Users.Handlers;

public sealed class UpdateUserSystemPermissionsHandler
{
    private readonly IUserRepository _userRepository;

    public UpdateUserSystemPermissionsHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task HandleAsync(Guid userId, UpdateUserSystemPermissionsRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Пользователь не найден.");

        user.ChangeSystemPermissions(
            request.CanManageMaterials,
            request.CanArchiveMaterials,
            request.CanRestoreMaterials,
            request.CanPermanentlyDeleteMaterials,
            request.CanCancelDocuments,
            request.CanManageSupplies);

        await _userRepository.UpdateAsync(user);
        await _userRepository.SaveChangesAsync();
    }
}
