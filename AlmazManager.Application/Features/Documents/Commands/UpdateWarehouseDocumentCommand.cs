namespace AlmazManager.Application.Features.Documents.Commands;

public sealed record UpdateWarehouseDocumentCommand(
    Guid DocumentId,
    string? Comment,
    List<UpdateWarehouseDocumentItemCommand> Items);

public sealed record UpdateWarehouseDocumentItemCommand(
    Guid MaterialId,
    decimal Quantity);
