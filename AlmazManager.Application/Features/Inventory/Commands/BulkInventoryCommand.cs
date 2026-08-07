namespace AlmazManager.Application.Features.Inventory.Commands;

public sealed record BulkInventoryCommand(
    Guid UserId,
    string? Comment,
    List<BulkInventoryItemCommand> Items);
