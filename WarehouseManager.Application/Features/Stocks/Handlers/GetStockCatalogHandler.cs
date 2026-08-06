using WarehouseManager.Contracts.Requests.Stocks;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Stocks.Handlers;

public sealed class GetStockCatalogHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;

    public GetStockCatalogHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
    }

    public async Task<StockCatalogResponse> HandleAsync(
        StockCatalogRequest request)
    {
        var page = request.Page < 1
            ? 1
            : request.Page;

        var pageSize = request.PageSize switch
        {
            < 1 => 20,
            > 100 => 100,
            _ => request.PageSize
        };

        var materials = await _materialRepository.GetAllAsync();
        var stocks = await _stockRepository.GetAllAsync();

        var stockByMaterialId = stocks.ToDictionary(
            stock => stock.MaterialId);

        var query = materials
            .Select(material =>
            {
                stockByMaterialId.TryGetValue(
                    material.Id,
                    out var stock);

                var currentQuantity = stock?.Quantity ?? 0;
                var belowMinimum =
                    currentQuantity < material.MinimumQuantity;

                return new StockCatalogItemResponse(
                    material.Id,
                    material.Name,
                    material.Article,
                    material.CategoryId,
                    material.Unit.ToString(),
                    currentQuantity,
                    material.MinimumQuantity,
                    currentQuantity - material.MinimumQuantity,
                    belowMinimum,
                    currentQuantity > 0,
                    material.IsActive,
                    stock?.UpdatedAtUtc);
            })
            .AsEnumerable();

        if (!request.IncludeArchived)
        {
            query = query.Where(item => item.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(item =>
                item.MaterialName.Contains(
                    search,
                    StringComparison.OrdinalIgnoreCase)
                ||
                item.Article.Contains(
                    search,
                    StringComparison.OrdinalIgnoreCase));
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(item =>
                item.CategoryId == request.CategoryId.Value);
        }

        if (request.BelowMinimum.HasValue)
        {
            query = query.Where(item =>
                item.BelowMinimum == request.BelowMinimum.Value);
        }

        if (request.HasStock.HasValue)
        {
            query = query.Where(item =>
                item.HasStock == request.HasStock.Value);
        }

        query = ApplySorting(
            query,
            request.SortBy,
            request.SortDirection);

        var filteredItems = query.ToList();

        var totalCount = filteredItems.Count;

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(
                totalCount / (double)pageSize);

        var totalQuantity = filteredItems.Sum(
            item => item.CurrentQuantity);

        var belowMinimumCount = filteredItems.Count(
            item => item.BelowMinimum);

        var withoutStockCount = filteredItems.Count(
            item => !item.HasStock);

        var items = filteredItems
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new StockCatalogResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            totalQuantity,
            belowMinimumCount,
            withoutStockCount,
            items);
    }

    private static IEnumerable<StockCatalogItemResponse> ApplySorting(
        IEnumerable<StockCatalogItemResponse> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = string.Equals(
            sortDirection,
            "desc",
            StringComparison.OrdinalIgnoreCase);

        var normalizedSortBy =
            sortBy?.Trim().ToLowerInvariant();

        return normalizedSortBy switch
        {
            "article" => descending
                ? query.OrderByDescending(item => item.Article)
                : query.OrderBy(item => item.Article),

            "quantity" => descending
                ? query.OrderByDescending(item => item.CurrentQuantity)
                : query.OrderBy(item => item.CurrentQuantity),

            "minimum" => descending
                ? query.OrderByDescending(item => item.MinimumQuantity)
                : query.OrderBy(item => item.MinimumQuantity),

            "difference" => descending
                ? query.OrderByDescending(item => item.DifferenceFromMinimum)
                : query.OrderBy(item => item.DifferenceFromMinimum),

            "updated" => descending
                ? query.OrderByDescending(item => item.UpdatedAtUtc)
                : query.OrderBy(item => item.UpdatedAtUtc),

            _ => descending
                ? query.OrderByDescending(item => item.MaterialName)
                : query.OrderBy(item => item.MaterialName)
        };
    }
}