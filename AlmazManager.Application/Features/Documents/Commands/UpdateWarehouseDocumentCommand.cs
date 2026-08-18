namespace AlmazManager.Application.Features.Documents.Commands;

public sealed record UpdateWarehouseDocumentCommand(
    Guid DocumentId,
    DateOnly? DocumentDate,
    string? Supplier,
    string? ExternalNumber,
    string? Recipient,
    string? Comment,
    List<UpdateWarehouseDocumentItemCommand> Items);

public sealed record UpdateWarehouseDocumentItemCommand(
    Guid MaterialId,
    decimal Quantity);
