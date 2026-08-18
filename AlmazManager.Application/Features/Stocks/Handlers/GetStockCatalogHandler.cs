using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Requests.Stocks;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Stocks.Handlers;

public sealed class GetStockCatalogHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStockRepository _stockRepository;
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly IUserPreferenceRepository _preferenceRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ISupplyInvoiceRepository _supplyInvoiceRepository;

    public GetStockCatalogHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        IStockRepository stockRepository,
        ICategoryAccessService categoryAccessService,
        IUserPreferenceRepository preferenceRepository,
        ICurrentUserService currentUserService,
        ISupplyInvoiceRepository supplyInvoiceRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
        _stockRepository = stockRepository;
        _categoryAccessService = categoryAccessService;
        _preferenceRepository = preferenceRepository;
        _currentUserService = currentUserService;
        _supplyInvoiceRepository = supplyInvoiceRepository;
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
            > 2000 => 2000,
            _ => request.PageSize
        };

        var materials = await _materialRepository.GetAllAsync();
        var categories = await _categoryRepository.GetAllAsync();
        var stocks = await _stockRepository.GetAllAsync();
        var openSupplies = await _supplyInvoiceRepository.GetOpenAsync();
        var expectedByMaterialId = openSupplies
            .SelectMany(invoice => invoice.Items)
            .GroupBy(item => item.MaterialId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.RemainingQuantity));

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            materials = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .ToList();
        }

        var stockByMaterialId = stocks.ToDictionary(
            stock => stock.MaterialId);
        var categoryById = categories.ToDictionary(
            category => category.Id,
            category => category.Name);

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
                    categoryById.GetValueOrDefault(material.CategoryId, "Без категории"),
                    material.Unit.ToString(),
                    material.Kind.ToString(),
                    material.WidthMeters,
                    material.ColorCode,
                    material.ColorName,
                    material.ColorHex,
                    currentQuantity,
                    expectedByMaterialId.GetValueOrDefault(material.Id),
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
                    StringComparison.OrdinalIgnoreCase)
                ||
                item.CategoryName.Contains(
                    search,
                    StringComparison.OrdinalIgnoreCase)
                ||
                (item.ColorCode?.Contains(
                    search,
                    StringComparison.OrdinalIgnoreCase) ?? false)
                ||
                (item.ColorName?.Contains(
                    search,
                    StringComparison.OrdinalIgnoreCase) ?? false)
                ||
                (item.WidthMeters?.ToString("0.###")
                    .Replace('.', ',')
                    .Contains(search, StringComparison.OrdinalIgnoreCase) ?? false));
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

        if (string.IsNullOrWhiteSpace(request.SortBy) &&
            string.IsNullOrWhiteSpace(request.Search))
        {
            var preference = await _preferenceRepository.GetByUserIdAsync(_currentUserService.UserId);
            var materialOrder = (preference?.MaterialOrder ?? [])
                .Select((id, index) => new { id, index })
                .ToDictionary(x => x.id, x => x.index);
            var categoryOrder = (preference?.CategoryOrder ?? [])
                .Select((id, index) => new { id, index })
                .ToDictionary(x => x.id, x => x.index);

            query = query
                .OrderBy(item => categoryOrder.GetValueOrDefault(item.CategoryId, int.MaxValue))
                .ThenBy(item => materialOrder.GetValueOrDefault(item.MaterialId, int.MaxValue))
                .ThenBy(item => item.MaterialName);
        }
        else
        {
            query = ApplySorting(query, request.SortBy, request.SortDirection);
        }

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
