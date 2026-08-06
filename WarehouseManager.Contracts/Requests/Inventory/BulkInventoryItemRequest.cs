namespace WarehouseManager.Contracts.Requests.Inventory;

public sealed record BulkInventoryItemRequest(
    Guid MaterialId,
    decimal ActualQuantity,
    string? Comment);