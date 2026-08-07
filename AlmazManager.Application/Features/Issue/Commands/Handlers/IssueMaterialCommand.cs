namespace AlmazManager.Application.Features.Issue.Commands;

public sealed record IssueMaterialCommand(
    Guid MaterialId,
    decimal Quantity,
    Guid UserId,
    string Receiver,
    string Department,
    string? OrderNumber,
    string? Comment);
