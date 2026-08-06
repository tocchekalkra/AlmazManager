namespace WarehouseManager.Contracts.Responses.Inventory;

public sealed record IssueInventoryResponse(
    Guid OperationId,
    Guid MaterialId,
    decimal PreviousQuantity,
    decimal ActualQuantity,
    decimal Difference,
    DateTime CreatedAtUtc);