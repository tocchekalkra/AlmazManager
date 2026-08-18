namespace AlmazManager.Contracts.Requests.Documents;

public sealed record UpdateWarehouseDocumentRequest(
    DateOnly? DocumentDate,
    string? Supplier,
    string? ExternalNumber,
    string? Recipient,
    string? Comment,
    List<UpdateWarehouseDocumentItemRequest> Items);

public sealed record UpdateWarehouseDocumentItemRequest(
    Guid MaterialId,
    decimal Quantity);
