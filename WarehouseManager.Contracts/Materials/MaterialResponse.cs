namespace WarehouseManager.Contracts.Responses;

public sealed record MaterialResponse(
    Guid Id,
    string Name,
    string Article,
    Guid CategoryId,
    decimal MinimumQuantity,
    string Unit,
    bool IsActive);