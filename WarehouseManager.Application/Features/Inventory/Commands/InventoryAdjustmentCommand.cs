namespace WarehouseManager.Application.Features.Inventory.Commands;

public sealed record InventoryAdjustmentCommand(
    Guid MaterialId,
    decimal ActualQuantity,
    Guid UserId,
    string? Comment);