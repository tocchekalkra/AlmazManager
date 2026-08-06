namespace WarehouseManager.Contracts.Responses;

public sealed record OperationCatalogItemResponse(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    string MaterialArticle,
    string Type,
    decimal Quantity,
    Guid UserId,
    DateTime CreatedAtUtc,
    string? Comment);