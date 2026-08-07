using AlmazManager.Contracts.Requests.Materials;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialCatalogHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;

    public GetMaterialCatalogHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
    }

    public async Task<MaterialCatalogResponse> HandleAsync(
        MaterialCatalogRequest request)
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
            stock => stock.MaterialId,
            stock => stock.Quantity);

        var query = materials
            .Select(material =>
            {
                var currentQuantity = stockByMaterialId
                    .GetValueOrDefault(material.Id, 0);

                return new MaterialCatalogItemResponse(
                    material.Id,
                    material.Name,
                    material.Article,
                    material.CategoryId,
                    material.Unit.ToString(),
                    material.MinimumQuantity,
                    currentQuantity,
                    currentQuantity < material.MinimumQuantity,
                    material.IsActive);
            })
            .AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(item =>
                item.Name.Contains(
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
            query = request.HasStock.Value
                ? query.Where(item => item.CurrentQuantity > 0)
                : query.Where(item => item.CurrentQuantity <= 0);
        }

        query = ApplySorting(
            query,
            request.SortBy,
            request.SortDirection);

        var totalCount = query.Count();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(
                totalCount / (double)pageSize);

        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new MaterialCatalogResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            items);
    }

    private static IEnumerable<MaterialCatalogItemResponse> ApplySorting(
        IEnumerable<MaterialCatalogItemResponse> query,
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

            "minimumquantity" => descending
                ? query.OrderByDescending(item => item.MinimumQuantity)
                : query.OrderBy(item => item.MinimumQuantity),

            "category" => descending
                ? query.OrderByDescending(item => item.CategoryId)
                : query.OrderBy(item => item.CategoryId),

            _ => descending
                ? query.OrderByDescending(item => item.Name)
                : query.OrderBy(item => item.Name)
        };
    }
}
