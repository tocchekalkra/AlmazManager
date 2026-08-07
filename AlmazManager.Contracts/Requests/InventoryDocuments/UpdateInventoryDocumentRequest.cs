namespace AlmazManager.Contracts.Requests.InventoryDocuments;

public sealed record UpdateInventoryDocumentRequest(
    string? Comment,
    List<UpdateInventoryDocumentItemRequest> Items);
