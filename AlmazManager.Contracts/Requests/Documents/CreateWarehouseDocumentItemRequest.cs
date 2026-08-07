namespace AlmazManager.Contracts.Requests.Documents;

public sealed record CreateWarehouseDocumentItemRequest(
    Guid MaterialId,
    decimal Quantity);
