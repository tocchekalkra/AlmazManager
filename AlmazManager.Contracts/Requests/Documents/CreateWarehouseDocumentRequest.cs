namespace AlmazManager.Contracts.Requests.Documents;

public sealed record CreateWarehouseDocumentRequest(
    string Type,
    DateOnly? DocumentDate,
    Guid? SupplyInvoiceId,
    string? Supplier,
    string? ExternalNumber,
    string? Recipient,
    string? Comment,
    List<CreateWarehouseDocumentItemRequest> Items);
