namespace WarehouseManager.Contracts.Responses;

public sealed record IssueMaterialResponse(
    Guid OperationId,
    Guid MaterialId,
    decimal IssuedQuantity,
    decimal CurrentQuantity,
    DateTime CreatedAtUtc);