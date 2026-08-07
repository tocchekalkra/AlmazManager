namespace AlmazManager.Contracts.Requests.Issue;

public sealed record IssueMaterialRequest(
    Guid MaterialId,
    decimal Quantity,
    Guid UserId,
    string Receiver,
    string Department,
    string? OrderNumber,
    string? Comment);
