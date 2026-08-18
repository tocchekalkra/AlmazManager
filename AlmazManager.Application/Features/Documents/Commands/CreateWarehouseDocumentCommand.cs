namespace AlmazManager.Application.Features.Documents.Commands;

public sealed record CreateWarehouseDocumentCommand(
    string Type,
    DateOnly DocumentDate,
    Guid? SupplyInvoiceId,
    string? Supplier,
    string? ExternalNumber,
    string? Recipient,
    string? Comment,
    List<CreateWarehouseDocumentItemCommand> Items);

public sealed record CreateWarehouseDocumentItemCommand(
    Guid MaterialId,
    decimal Quantity);
