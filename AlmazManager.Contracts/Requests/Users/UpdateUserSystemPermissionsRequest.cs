namespace AlmazManager.Contracts.Requests.Users;

public sealed record UpdateUserSystemPermissionsRequest(
    bool CanManageMaterials,
    bool CanArchiveMaterials,
    bool CanRestoreMaterials,
    bool CanPermanentlyDeleteMaterials,
    bool CanCancelDocuments,
    bool CanManageSupplies);
