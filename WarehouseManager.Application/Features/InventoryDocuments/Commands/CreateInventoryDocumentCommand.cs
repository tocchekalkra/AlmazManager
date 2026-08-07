namespace WarehouseManager.Application.Features.InventoryDocuments.Commands;

public sealed record CreateInventoryDocumentCommand(
    Guid UserId,
    string? Comment,
    List<CreateInventoryDocumentItemCommand> Items);

public sealed record CreateInventoryDocumentItemCommand(
    Guid MaterialId,
    decimal ActualQuantity);