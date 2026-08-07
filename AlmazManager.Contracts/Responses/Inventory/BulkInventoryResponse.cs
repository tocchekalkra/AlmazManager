namespace AlmazManager.Contracts.Responses.Inventory;

public sealed record BulkInventoryResponse(
    int TotalItems,
    int ChangedItems,
    int UnchangedItems,
    DateTime CompletedAtUtc,
    List<BulkInventoryItemResponse> Items);
