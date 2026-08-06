namespace WarehouseManager.Application.Features.Inventory.Commands;

public sealed record BulkInventoryItemCommand(
    Guid MaterialId,
    decimal ActualQuantity,
    string? Comment);