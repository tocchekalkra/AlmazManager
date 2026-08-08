namespace AlmazManager.Application.Features.Documents.Commands;

public sealed record CreateWarehouseDocumentCommand(
    string Type,
    string? Supplier,
    string? ExternalNumber,
    string? Comment,
    List<CreateWarehouseDocumentItemCommand> Items);

public sealed record CreateWarehouseDocumentItemCommand(
    Guid MaterialId,
    decimal Quantity);