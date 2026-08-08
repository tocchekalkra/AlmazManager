namespace AlmazManager.Contracts.Responses;

public sealed record UserCategoryAccessResponse(
    Guid CategoryId,
    string CategoryName,
    bool CanView,
    bool CanReceive,
    bool CanIssue,
    bool CanInventory);