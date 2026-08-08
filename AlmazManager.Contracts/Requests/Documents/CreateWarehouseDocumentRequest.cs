namespace AlmazManager.Contracts.Requests.Documents;

public sealed record CreateWarehouseDocumentRequest(
    string Type,
    string? Supplier,
    string? ExternalNumber,
    string? Comment,
    List<CreateWarehouseDocumentItemRequest> Items);