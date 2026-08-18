using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Materials;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class MaterialArchiveHandler
{
    private readonly IMaterialRepository _materials;
    private readonly ISystemAccessService _systemAccess;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditEventRepository _audit;
    private readonly ICategoryAccessService _categoryAccess;

    public MaterialArchiveHandler(
        IMaterialRepository materials,
        ISystemAccessService systemAccess,
        ICurrentUserService currentUser,
        IAuditEventRepository audit,
        ICategoryAccessService categoryAccess)
    {
        _materials = materials;
        _systemAccess = systemAccess;
        _currentUser = currentUser;
        _audit = audit;
        _categoryAccess = categoryAccess;
    }

    public async Task<MaterialArchiveImpactResponse> GetImpactAsync(Guid materialId)
    {
        var material = await GetRequiredAsync(materialId);
        var hasHistory = await _materials.HasAnyDependenciesAsync(materialId);
        var openSupplyLinks = await _materials.CountOpenSupplyLinksAsync(materialId);

        return new MaterialArchiveImpactResponse(
            material.Id,
            material.Name,
            hasHistory,
            openSupplyLinks,
            !hasHistory);
    }

    public async Task DeletePermanentlyAsync(Guid materialId, string confirmationName)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.PermanentlyDeleteMaterials);
        var material = await GetRequiredAsync(materialId);

        if (!string.Equals(material.Name, confirmationName?.Trim(), StringComparison.Ordinal))
            throw new ArgumentException("Для подтверждения введите точное название материала.");

        if (await _materials.HasAnyDependenciesAsync(materialId))
            throw new InvalidOperationException("Материал связан с операциями, документами или поставками. Доступно только архивирование.");

        await _audit.AddAsync(new Domain.Entities.AuditEvent(
            _currentUser.UserId,
            "MaterialDeleted",
            "Material",
            material.Id,
            $"Материал '{material.Name}' безвозвратно удалён.",
            material.Id));

        await _materials.DeleteAsync(material);
        await _materials.SaveChangesAsync();
    }

    private async Task<Domain.Entities.Material> GetRequiredAsync(Guid materialId)
    {
        var material = await _materials.GetByIdAsync(materialId)
            ?? throw new InvalidOperationException("Материал не найден.");

        await _categoryAccess.EnsureAccessAsync(
            material.CategoryId,
            CategoryPermission.View);

        return material;
    }
}
