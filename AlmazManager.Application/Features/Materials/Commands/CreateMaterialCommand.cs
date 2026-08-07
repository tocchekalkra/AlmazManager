namespace AlmazManager.Application.Features.Materials.Commands;

public sealed record CreateMaterialCommand(
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity);
