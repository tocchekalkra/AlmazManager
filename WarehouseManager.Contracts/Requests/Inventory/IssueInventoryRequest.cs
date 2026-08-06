namespace WarehouseManager.Contracts.Requests.Inventory;

public sealed record IssueInventoryRequest(
    Guid MaterialId,
    decimal ActualQuantity,
    Guid UserId,
    string? Comment);