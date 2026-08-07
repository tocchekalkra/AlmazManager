namespace WarehouseManager.Contracts.Responses.InventoryDocuments;

public sealed record InventoryDocumentResponse(
    Guid Id,
    string Number,
    Guid UserId,
    string? Comment,
    string Status,
    DateTime CreatedAtUtc,
    DateTime? PostedAtUtc,
    DateTime? CancelledAtUtc,
    int TotalItems,
    int ChangedItems,
    IReadOnlyCollection<InventoryDocumentItemResponse> Items);