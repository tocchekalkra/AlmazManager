namespace AlmazManager.Contracts.Responses;

public sealed record CurrentUserAccessResponse(
    bool CanInventoryStandard,
    bool CanInventoryOracal,
    bool CanManageMaterials,
    bool CanArchiveMaterials,
    bool CanRestoreMaterials,
    bool CanPermanentlyDeleteMaterials,
    bool CanCancelDocuments,
    bool CanManageSupplies,
    string Theme);
