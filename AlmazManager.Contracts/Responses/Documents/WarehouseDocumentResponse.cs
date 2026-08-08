namespace AlmazManager.Contracts.Responses.Documents;

public sealed record WarehouseDocumentResponse(
    Guid Id,
    string Number,
    string Type,
    string Status,
    Guid UserId,
    string? Supplier,
    string? ExternalNumber,
    string? Comment,
    DateTime CreatedAtUtc,
    DateTime? PostedAtUtc,
    DateTime? CancelledAtUtc,
    List<WarehouseDocumentItemResponse> Items);