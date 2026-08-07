namespace AlmazManager.Contracts.Requests.InventoryDocuments;

public sealed record CreateInventoryDocumentItemRequest(
    Guid MaterialId,
    decimal ActualQuantity);
