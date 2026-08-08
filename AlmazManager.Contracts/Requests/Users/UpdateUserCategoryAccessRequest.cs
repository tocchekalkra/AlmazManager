namespace AlmazManager.Contracts.Requests.Users;

public sealed record UpdateUserCategoryAccessRequest(
    Guid CategoryId,
    bool CanView,
    bool CanReceive,
    bool CanIssue,
    bool CanInventoryStandard,
    bool CanInventoryOracal);