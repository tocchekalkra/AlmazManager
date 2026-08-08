namespace AlmazManager.Contracts.Responses;

public sealed record CurrentUserAccessResponse(
    bool CanInventoryStandard,
    bool CanInventoryOracal);