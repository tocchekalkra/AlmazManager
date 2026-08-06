namespace WarehouseManager.Application.Features.Materials.Commands;

public sealed record UpdateMaterialCommand(
    Guid MaterialId,
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity);