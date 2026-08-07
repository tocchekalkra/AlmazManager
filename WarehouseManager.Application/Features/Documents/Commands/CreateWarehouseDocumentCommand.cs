namespace WarehouseManager.Application.Features.Documents.Commands;

public sealed record CreateWarehouseDocumentItemCommand(
    Guid MaterialId,
    decimal Quantity);

public sealed record CreateWarehouseDocumentCommand(
    string Type,
    Guid UserId,
    string? Comment,
    List<CreateWarehouseDocumentItemCommand> Items);