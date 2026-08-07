namespace AlmazManager.Contracts.Responses;

public sealed record OperationCatalogResponse(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    List<OperationCatalogItemResponse> Items);
