namespace WarehouseManager.Contracts.Requests.Materials;

public sealed record UpdateMaterialRequest(
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity);