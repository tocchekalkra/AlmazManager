namespace WarehouseManager.Contracts.Requests.Inventory;

public sealed record BulkInventoryRequest(
    Guid UserId,
    string? Comment,
    List<BulkInventoryItemRequest> Items);