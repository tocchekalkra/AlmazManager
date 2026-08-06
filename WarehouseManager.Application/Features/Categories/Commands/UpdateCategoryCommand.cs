namespace WarehouseManager.Application.Features.Categories.Commands;

public sealed record UpdateCategoryCommand(
    Guid CategoryId,
    string Name);