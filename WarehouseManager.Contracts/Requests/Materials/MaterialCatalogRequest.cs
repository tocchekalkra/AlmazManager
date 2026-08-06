namespace WarehouseManager.Contracts.Requests.Materials;

public sealed class MaterialCatalogRequest
{
    public string? Search { get; init; }

    public Guid? CategoryId { get; init; }

    public bool? BelowMinimum { get; init; }

    public bool? HasStock { get; init; }

    public string SortBy { get; init; } = "name";

    public string SortDirection { get; init; } = "asc";

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}