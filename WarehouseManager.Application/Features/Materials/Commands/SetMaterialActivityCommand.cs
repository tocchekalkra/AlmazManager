namespace WarehouseManager.Application.Features.Materials.Commands;

public sealed record SetMaterialActivityCommand(
    Guid MaterialId,
    bool IsActive);