namespace WarehouseManager.Contracts.Requests.Documents;

public sealed record CreateWarehouseDocumentRequest(
    string Type,
    Guid UserId,
    string? Comment,
    List<CreateWarehouseDocumentItemRequest> Items);