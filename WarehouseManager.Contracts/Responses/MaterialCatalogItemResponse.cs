namespace WarehouseManager.Contracts.Responses;

public sealed record MaterialCatalogItemResponse(
    Guid Id,
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity,
    decimal CurrentQuantity,
    bool BelowMinimum,
    bool IsActive);