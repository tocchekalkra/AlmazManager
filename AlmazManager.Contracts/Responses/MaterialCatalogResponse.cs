namespace AlmazManager.Contracts.Responses;

public sealed record MaterialCatalogResponse(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    List<MaterialCatalogItemResponse> Items);
