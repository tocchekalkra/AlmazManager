namespace AlmazManager.Contracts.Responses;

public sealed record UserResponse(
    Guid Id,
    string FullName,
    string Login,
    string Role,
    bool IsActive,
    DateTime CreatedAtUtc,
    bool CanManageMaterials,
    bool CanArchiveMaterials,
    bool CanRestoreMaterials,
    bool CanPermanentlyDeleteMaterials,
    bool CanCancelDocuments,
    bool CanManageSupplies);
