namespace WarehouseManager.Contracts.Responses;

public sealed record StockCatalogItemResponse(
    Guid MaterialId,
    string MaterialName,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal CurrentQuantity,
    decimal MinimumQuantity,
    decimal DifferenceFromMinimum,
    bool BelowMinimum,
    bool HasStock,
    bool IsActive,
    DateTime? UpdatedAtUtc);