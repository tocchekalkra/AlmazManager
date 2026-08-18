using AlmazManager.Application.Security;

namespace AlmazManager.Application.Interfaces;

public interface ISystemAccessService
{
    Task<bool> HasAccessAsync(SystemPermission permission);
    Task EnsureAccessAsync(SystemPermission permission);
}
