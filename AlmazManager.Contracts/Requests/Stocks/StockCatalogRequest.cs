namespace AlmazManager.Contracts.Requests.Stocks;

public sealed class StockCatalogRequest
{
    public string? Search { get; init; }

    public Guid? CategoryId { get; init; }

    public bool? BelowMinimum { get; init; }

    public bool? HasStock { get; init; }

    public bool IncludeArchived { get; init; } = false;

    public string SortBy { get; init; } = "name";

    public string SortDirection { get; init; } = "asc";

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}
