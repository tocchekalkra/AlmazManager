using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Requests.Materials;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialCatalogHandler
{
    private readonly IMaterialRepository
        _materialRepository;

    private readonly IStockRepository
        _stockRepository;

    private readonly ICategoryRepository
        _categoryRepository;

    private readonly ICategoryAccessService
        _categoryAccessService;

    private readonly IUserPreferenceRepository
        _preferenceRepository;

    private readonly ICurrentUserService
        _currentUserService;

    private readonly ISupplyInvoiceRepository
        _supplyInvoiceRepository;

    public GetMaterialCatalogHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        ICategoryRepository categoryRepository,
        ICategoryAccessService categoryAccessService,
        IUserPreferenceRepository preferenceRepository,
        ICurrentUserService currentUserService,
        ISupplyInvoiceRepository supplyInvoiceRepository)
    {
        _materialRepository =
            materialRepository;

        _stockRepository =
            stockRepository;

        _categoryRepository =
            categoryRepository;

        _categoryAccessService =
            categoryAccessService;

        _preferenceRepository = preferenceRepository;
        _currentUserService = currentUserService;
        _supplyInvoiceRepository = supplyInvoiceRepository;
    }

    public async Task<MaterialCatalogResponse>
        HandleAsync(
            MaterialCatalogRequest request)
    {
        var page =
            request.Page < 1
                ? 1
                : request.Page;

        var pageSize =
            request.PageSize switch
            {
                < 1 => 20,
                > 2000 => 2000,
                _ => request.PageSize
            };

        var materials =
            await _materialRepository
                .GetAllAsync();

        var stocks =
            await _stockRepository
                .GetAllAsync();

        var categoryNames =
            (await _categoryRepository.GetAllAsync())
                .ToDictionary(
                    category => category.Id,
                    category => category.Name);

        var openSupplies = await _supplyInvoiceRepository.GetOpenAsync();
        var expectedByMaterialId = openSupplies
            .SelectMany(invoice => invoice.Items)
            .GroupBy(item => item.MaterialId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(item => item.RemainingQuantity));

        var allowedCategoryIds =
            await _categoryAccessService
                .GetAllowedCategoryIdsAsync(
                    CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            materials =
                materials
                    .Where(material =>
                        allowedCategoryIds.Contains(
                            material.CategoryId))
                    .ToList();
        }

        var stockByMaterialId =
            stocks.ToDictionary(
                stock => stock.MaterialId,
                stock => stock.Quantity);

        var query =
            materials
                .Select(material =>
                {
                    var currentQuantity =
                        stockByMaterialId
                            .GetValueOrDefault(
                                material.Id,
                                0);

                    return new MaterialCatalogItemResponse(
                        material.Id,
                        material.Name,
                        material.Article,
                        material.CategoryId,
                        categoryNames.GetValueOrDefault(
                            material.CategoryId,
                            "Без категории"),
                        material.Unit.ToString(),
                        material.MinimumQuantity,
                        currentQuantity,
                        expectedByMaterialId.GetValueOrDefault(material.Id),
                        currentQuantity <
                        material.MinimumQuantity,
                        material.IsActive,

                        material.Kind.ToString(),
                        material.WidthMeters,
                        material.ColorCode,
                        material.ColorName,
                        material.ColorHex,
                        material.MachineName,
                        material.PackageLiters);
                })
                .AsEnumerable();

        if (!string.IsNullOrWhiteSpace(
                request.Search))
        {
            var search =
                request.Search.Trim();

            query =
                query.Where(item =>
                    item.Name.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    ||
                    item.Article.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    ||
                    (
                        item.ColorCode?.Contains(
                            search,
                            StringComparison.OrdinalIgnoreCase)
                        ?? false
                    )
                    ||
                    (
                        item.ColorName?.Contains(
                            search,
                            StringComparison.OrdinalIgnoreCase)
                        ?? false
                    )
                    ||
                    (
                        item.MachineName?.Contains(
                            search,
                            StringComparison.OrdinalIgnoreCase)
                        ?? false
                    ));
        }

        if (request.CategoryId.HasValue)
        {
            query =
                query.Where(item =>
                    item.CategoryId ==
                    request.CategoryId.Value);
        }

        if (request.BelowMinimum.HasValue)
        {
            query =
                query.Where(item =>
                    item.BelowMinimum ==
                    request.BelowMinimum.Value);
        }

        if (request.HasStock.HasValue)
        {
            query =
                request.HasStock.Value
                    ? query.Where(
                        item =>
                            item.CurrentQuantity > 0)
                    : query.Where(
                        item =>
                            item.CurrentQuantity <= 0);
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
                .ThenBy(item => materialOrder.GetValueOrDefault(item.Id, int.MaxValue))
                .ThenBy(item => item.Name);
        }
        else
        {
            query = ApplySorting(query, request.SortBy, request.SortDirection);
        }

        var totalCount =
            query.Count();

        var totalPages =
            totalCount == 0
                ? 0
                : (int)Math.Ceiling(
                    totalCount /
                    (double)pageSize);

        var items =
            query
                .Skip(
                    (page - 1) *
                    pageSize)
                .Take(pageSize)
                .ToList();

        return new MaterialCatalogResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            items);
    }

    private static
        IEnumerable<MaterialCatalogItemResponse>
        ApplySorting(
            IEnumerable<MaterialCatalogItemResponse>
                query,
            string? sortBy,
            string? sortDirection)
    {
        var descending =
            string.Equals(
                sortDirection,
                "desc",
                StringComparison.OrdinalIgnoreCase);

        var normalizedSortBy =
            sortBy?
                .Trim()
                .ToLowerInvariant();

        return normalizedSortBy switch
        {
            "article" =>
                descending
                    ? query.OrderByDescending(
                        item => item.Article)
                    : query.OrderBy(
                        item => item.Article),

            "quantity" =>
                descending
                    ? query.OrderByDescending(
                        item =>
                            item.CurrentQuantity)
                    : query.OrderBy(
                        item =>
                            item.CurrentQuantity),

            "minimumquantity" =>
                descending
                    ? query.OrderByDescending(
                        item =>
                            item.MinimumQuantity)
                    : query.OrderBy(
                        item =>
                            item.MinimumQuantity),

            "category" =>
                descending
                    ? query.OrderByDescending(
                        item =>
                            item.CategoryId)
                    : query.OrderBy(
                        item =>
                            item.CategoryId),

            "width" =>
                descending
                    ? query.OrderByDescending(
                        item =>
                            item.WidthMeters)
                    : query.OrderBy(
                        item =>
                            item.WidthMeters),

            "color" =>
                descending
                    ? query.OrderByDescending(
                        item =>
                            item.ColorCode)
                    : query.OrderBy(
                        item =>
                            item.ColorCode),

            _ =>
                descending
                    ? query.OrderByDescending(
                        item => item.Name)
                    : query.OrderBy(
                        item => item.Name)
        };
    }
}
