namespace WarehouseManager.Contracts.Requests.InventoryDocuments;

public sealed record UpdateInventoryDocumentItemRequest(
    Guid MaterialId,
    decimal ActualQuantity);