namespace AlmazManager.Application.Features.Receiving.Commands;

public sealed record ReceiveMaterialCommand(
    Guid MaterialId,
    decimal Quantity,
    Guid UserId,
    string? Comment);
