namespace AlmazManager.Application.Features.Materials.Commands;

public sealed record CreateMaterialCommand(
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity,
    string Kind,
    decimal? WidthMeters,
    string? ColorCode,
    string? ColorName,
    string? ColorHex,
    string? MachineName,
    decimal? PackageLiters);
