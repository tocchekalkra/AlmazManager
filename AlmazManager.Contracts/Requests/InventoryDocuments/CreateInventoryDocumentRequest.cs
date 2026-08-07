namespace AlmazManager.Contracts.Requests.InventoryDocuments;

public sealed record CreateInventoryDocumentRequest(
    Guid UserId,
    string? Comment,
    List<CreateInventoryDocumentItemRequest> Items);
