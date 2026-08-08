namespace AlmazManager.Contracts.Requests.Materials;

public sealed record CreateMaterialRequest(
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity,
    string Kind = "Standard",
    decimal? WidthMeters = null,
    string? ColorCode = null,
    string? ColorName = null,
    string? ColorHex = null);