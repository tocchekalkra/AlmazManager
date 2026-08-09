using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Requests.Operations;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Operations.Handlers;

public sealed class GetOperationCatalogHandler
{
    private readonly IOperationRepository _operationRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetOperationCatalogHandler(
        IOperationRepository operationRepository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _operationRepository = operationRepository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<OperationCatalogResponse> HandleAsync(
        OperationCatalogRequest request)
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

        var operations = await _operationRepository.GetAllAsync();
        var materials = await _materialRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            materials = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .ToList();

            var visibleMaterialIds = materials
                .Select(material => material.Id)
                .ToHashSet();

            operations = operations
                .Where(operation =>
                    visibleMaterialIds.Contains(operation.MaterialId))
                .ToList();
        }

        var materialById = materials.ToDictionary(
            material => material.Id);

        var query = operations.AsEnumerable();

        if (request.MaterialId.HasValue)
        {
            query = query.Where(operation =>
                operation.MaterialId == request.MaterialId.Value);
        }

        if (request.UserId.HasValue)
        {
            query = query.Where(operation =>
                operation.UserId == request.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            if (!Enum.TryParse<OperationType>(
                    request.Type.Trim(),
                    true,
                    out var operationType))
            {
                throw new ArgumentException(
                    "Неизвестный тип складской операции.",
                    nameof(request.Type));
            }

            query = query.Where(operation =>
                operation.Type == operationType);
        }

        if (request.DateFromUtc.HasValue)
        {
            query = query.Where(operation =>
                operation.CreatedAtUtc >= request.DateFromUtc.Value);
        }

        if (request.DateToUtc.HasValue)
        {
            query = query.Where(operation =>
                operation.CreatedAtUtc <= request.DateToUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(operation =>
            {
                materialById.TryGetValue(
                    operation.MaterialId,
                    out var material);

                var materialMatches =
                    material is not null
                    && (
                        material.Name.Contains(
                            search,
                            StringComparison.OrdinalIgnoreCase)
                        ||
                        material.Article.Contains(
                            search,
                            StringComparison.OrdinalIgnoreCase)
                    );

                var commentMatches =
                    operation.Comment?.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true;

                return materialMatches || commentMatches;
            });
        }

        var descending = !string.Equals(
            request.SortDirection,
            "asc",
            StringComparison.OrdinalIgnoreCase);

        query = descending
            ? query.OrderByDescending(operation =>
                operation.CreatedAtUtc)
            : query.OrderBy(operation =>
                operation.CreatedAtUtc);

        var totalCount = query.Count();

        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(
                totalCount / (double)pageSize);

        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(operation =>
            {
                materialById.TryGetValue(
                    operation.MaterialId,
                    out var material);

                return new OperationCatalogItemResponse(
                    operation.Id,
                    operation.MaterialId,
                    material?.Name ?? "Материал удалён",
                    material?.Article ?? "—",
                    operation.Type.ToString(),
                    operation.Quantity,
                    operation.UserId,
                    operation.CreatedAtUtc,
                    operation.Comment);
            })
            .ToList();

        return new OperationCatalogResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            items);
    }
}
