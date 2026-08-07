namespace AlmazManager.Application.Features.InventoryDocuments.Commands;

public sealed record UpdateInventoryDocumentCommand(
    Guid DocumentId,
    string? Comment,
    List<UpdateInventoryDocumentItemCommand> Items);

public sealed record UpdateInventoryDocumentItemCommand(
    Guid MaterialId,
    decimal ActualQuantity);
