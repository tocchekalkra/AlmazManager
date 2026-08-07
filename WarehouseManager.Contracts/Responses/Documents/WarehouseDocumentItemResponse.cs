namespace WarehouseManager.Contracts.Responses.Documents;

public sealed record WarehouseDocumentItemResponse(
    Guid Id,
    Guid MaterialId,
    decimal Quantity);