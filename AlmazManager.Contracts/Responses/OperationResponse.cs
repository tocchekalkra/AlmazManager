namespace AlmazManager.Contracts.Responses;

public sealed record OperationResponse(
    Guid Id,
    Guid MaterialId,
    string Type,
    decimal Quantity,
    Guid UserId,
    DateTime CreatedAtUtc,
    string? Comment);
