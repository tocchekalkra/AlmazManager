namespace AlmazManager.Contracts.Responses;

public sealed record StockCatalogResponse(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    decimal TotalQuantity,
    int BelowMinimumCount,
    int WithoutStockCount,
    List<StockCatalogItemResponse> Items);
