namespace AlmazManager.Application.Features.InventoryDocuments.Commands;

public sealed record CreateInventoryDocumentCommand(
    string? Comment,
    List<CreateInventoryDocumentItemCommand> Items);

public sealed record CreateInventoryDocumentItemCommand(
    Guid MaterialId,
    decimal ActualQuantity);