namespace AlmazManager.Contracts.Requests.Receiving;

public sealed record ReceivingRequest(
    Guid MaterialId,
    decimal Quantity,
    Guid UserId,
    string? Comment);
