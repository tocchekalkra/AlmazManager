namespace AlmazManager.Contracts.Requests.Materials;

public sealed record MaterialCatalogRequest(
    int Page = 1,
    int PageSize = 50,
    string? Search = null,
    Guid? CategoryId = null,
    bool? BelowMinimum = null,
    bool? HasStock = null,
    string? SortBy = null,
    string? SortDirection = null);