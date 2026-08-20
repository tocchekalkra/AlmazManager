namespace AlmazManager.Contracts.Responses;

public sealed record StockCatalogItemResponse(
    Guid MaterialId,
    string MaterialName,
    string Article,
    Guid CategoryId,
    string CategoryName,
    string Unit,
    string Kind,
    decimal? WidthMeters,
    string? ColorCode,
    string? ColorName,
    string? ColorHex,
    string? MachineName,
    decimal? PackageLiters,
    decimal CurrentQuantity,
    decimal ExpectedQuantity,
    decimal MinimumQuantity,
    decimal DifferenceFromMinimum,
    bool BelowMinimum,
    bool HasStock,
    bool IsActive,
    DateTime? UpdatedAtUtc);
