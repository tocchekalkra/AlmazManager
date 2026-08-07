namespace AlmazManager.Contracts.Requests.Documents;

public sealed record UpdateWarehouseDocumentRequest(
    string? Comment,
    List<UpdateWarehouseDocumentItemRequest> Items);

public sealed record UpdateWarehouseDocumentItemRequest(
    Guid MaterialId,
    decimal Quantity);
