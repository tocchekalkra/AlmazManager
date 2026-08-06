namespace WarehouseManager.Contracts.Responses;

public sealed record StockResponse(
    Guid Id,
    Guid MaterialId,
    decimal Quantity,
    DateTime UpdatedAtUtc);