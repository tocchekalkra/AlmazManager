namespace WarehouseManager.Contracts.Responses.Inventory;

public sealed record BulkInventoryItemResponse(
    Guid MaterialId,
    decimal PreviousQuantity,
    decimal ActualQuantity,
    decimal Difference,
    bool Changed,
    Guid? OperationId);