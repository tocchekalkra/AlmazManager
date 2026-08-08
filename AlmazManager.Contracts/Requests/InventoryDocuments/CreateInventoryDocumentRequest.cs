namespace AlmazManager.Contracts.Requests.InventoryDocuments;

public sealed record CreateInventoryDocumentRequest(
    string? Comment,
    List<CreateInventoryDocumentItemRequest> Items);