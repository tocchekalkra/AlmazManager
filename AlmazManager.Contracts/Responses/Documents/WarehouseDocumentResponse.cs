namespace AlmazManager.Contracts.Responses.Documents;

public sealed record WarehouseDocumentResponse(
    Guid Id,
    string Number,
    string Type,
    string Status,
    Guid UserId,
    int? SequenceNumber,
    DateOnly DocumentDate,
    Guid? SupplyInvoiceId,
    string? Supplier,
    string? ExternalNumber,
    string? Recipient,
    string? Comment,
    DateTime CreatedAtUtc,
    DateTime? PostedAtUtc,
    DateTime? CancelledAtUtc,
    List<WarehouseDocumentItemResponse> Items);
