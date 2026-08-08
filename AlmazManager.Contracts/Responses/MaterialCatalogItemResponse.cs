namespace AlmazManager.Contracts.Responses;

public sealed record MaterialCatalogItemResponse(
    Guid Id,
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity,
    decimal CurrentQuantity,
    bool BelowMinimum,
    bool IsActive,
    string Kind,
    decimal? WidthMeters,
    string? ColorCode,
    string? ColorName,
    string? ColorHex);