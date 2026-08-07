namespace AlmazManager.Contracts.Requests.InventoryDocuments;

public sealed record UpdateInventoryDocumentItemRequest(
    Guid MaterialId,
    decimal ActualQuantity);
