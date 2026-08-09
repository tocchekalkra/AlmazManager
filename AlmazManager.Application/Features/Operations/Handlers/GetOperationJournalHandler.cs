using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Requests.Operations;
using AlmazManager.Contracts.Responses.Operations;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Operations.Handlers;

public sealed class GetOperationJournalHandler
{
    private readonly IOperationRepository _operationRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWarehouseDocumentRepository _documentRepository;
    private readonly IInventoryDocumentRepository _inventoryDocumentRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetOperationJournalHandler(
        IOperationRepository operationRepository,
        IMaterialRepository materialRepository,
        IUserRepository userRepository,
        IWarehouseDocumentRepository documentRepository,
        IInventoryDocumentRepository inventoryDocumentRepository,
        ICategoryAccessService categoryAccessService)
    {
        _operationRepository = operationRepository;
        _materialRepository = materialRepository;
        _userRepository = userRepository;
        _documentRepository = documentRepository;
        _inventoryDocumentRepository = inventoryDocumentRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<OperationJournalResponse> HandleAsync(
        OperationJournalRequest request)
    {
        var page =
            request.Page < 1
                ? 1
                : request.Page;

        var pageSize =
            request.PageSize switch
            {
                < 1 => 50,
                > 200 => 200,
                _ => request.PageSize
            };

        var operations =
            await _operationRepository.GetAllAsync();

        var materials =
            await _materialRepository.GetAllAsync();

        var users =
            await _userRepository.GetAllAsync();

        var documents =
            await _documentRepository.GetAllAsync();

        var inventoryDocuments =
            await _inventoryDocumentRepository.GetAllAsync();

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

        var materialById =
            materials.ToDictionary(x => x.Id);

        var userById =
            users.ToDictionary(x => x.Id);

        var documentNumberById =
            documents.ToDictionary(x => x.Id, x => x.Number);

        foreach (var inventoryDocument in inventoryDocuments)
        {
            documentNumberById[inventoryDocument.Id] =
                inventoryDocument.Number;
        }

        var query = operations.AsEnumerable();

        if (request.MaterialId.HasValue)
        {
            query = query.Where(x =>
                x.MaterialId ==
                request.MaterialId.Value);
        }

        if (request.CategoryId.HasValue)
        {
            var materialIdsInCategory = materials
                .Where(material =>
                    material.CategoryId == request.CategoryId.Value)
                .Select(material => material.Id)
                .ToHashSet();

            query = query.Where(operation =>
                materialIdsInCategory.Contains(operation.MaterialId));
        }

        if (request.DocumentId.HasValue)
        {
            query = query.Where(x =>
                x.DocumentId ==
                request.DocumentId.Value);
        }

        if (request.UserId.HasValue)
        {
            query = query.Where(x =>
                x.UserId ==
                request.UserId.Value);
        }

        if (request.IsReversal.HasValue)
        {
            query = query.Where(x =>
                x.IsReversal ==
                request.IsReversal.Value);
        }

        if (!string.IsNullOrWhiteSpace(
                request.Type))
        {
            if (!Enum.TryParse<OperationType>(
                    request.Type,
                    true,
                    out var operationType))
            {
                throw new ArgumentException(
                    "Неизвестный тип операции.");
            }

            query = query.Where(x =>
                x.Type == operationType);
        }

        if (request.DateFromUtc.HasValue)
        {
            query = query.Where(x =>
                x.CreatedAtUtc >=
                request.DateFromUtc.Value);
        }

        if (request.DateToUtc.HasValue)
        {
            query = query.Where(x =>
                x.CreatedAtUtc <=
                request.DateToUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(
                request.Search))
        {
            var search =
                request.Search.Trim();

            query = query.Where(operation =>
            {
                materialById.TryGetValue(
                    operation.MaterialId,
                    out var material);

                userById.TryGetValue(
                    operation.UserId,
                    out var user);

                string? documentNumber = null;

                if (operation.DocumentId.HasValue)
                {
                    documentNumberById.TryGetValue(
                        operation.DocumentId.Value,
                        out documentNumber);
                }

                return
                    material?.Name.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true
                    ||
                    material?.Article.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true
                    ||
                    user?.FullName.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true
                    ||
                    user?.Login.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true
                    ||
                    documentNumber?.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true
                    ||
                    operation.Comment?.Contains(
                        search,
                        StringComparison.OrdinalIgnoreCase)
                    == true;
            });
        }

        var descending =
            !string.Equals(
                request.SortDirection,
                "asc",
                StringComparison.OrdinalIgnoreCase);

        query = descending
            ? query.OrderByDescending(
                x => x.CreatedAtUtc)
            : query.OrderBy(
                x => x.CreatedAtUtc);

        var totalCount = query.Count();

        var totalPages =
            totalCount == 0
                ? 0
                : (int)Math.Ceiling(
                    totalCount /
                    (double)pageSize);

        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(operation =>
                Map(
                    operation,
                    materialById,
                    userById,
                    documentNumberById))
            .ToList();

        return new OperationJournalResponse(
            page,
            pageSize,
            totalCount,
            totalPages,
            items);
    }

    public async Task<OperationJournalItemResponse?>
        HandleByIdAsync(Guid id)
    {
        var operation =
            await _operationRepository.GetByIdAsync(id);

        if (operation is null)
        {
            return null;
        }

        var materials =
            await _materialRepository.GetAllAsync();

        var users =
            await _userRepository.GetAllAsync();

        var documents =
            await _documentRepository.GetAllAsync();

        var inventoryDocuments =
            await _inventoryDocumentRepository.GetAllAsync();

        var material =
            materials.FirstOrDefault(x => x.Id == operation.MaterialId);

        if (material is null ||
            !await _categoryAccessService.HasAccessAsync(
                material.CategoryId,
                CategoryPermission.View))
        {
            return null;
        }

        var documentNumbers =
            documents.ToDictionary(x => x.Id, x => x.Number);

        foreach (var inventoryDocument in inventoryDocuments)
        {
            documentNumbers[inventoryDocument.Id] =
                inventoryDocument.Number;
        }

        return Map(
            operation,
            materials.ToDictionary(x => x.Id),
            users.ToDictionary(x => x.Id),
            documentNumbers);
    }

    private static OperationJournalItemResponse Map(
        Operation operation,
        Dictionary<Guid, Material> materials,
        Dictionary<Guid, AppUser> users,
        Dictionary<Guid, string> documentNumbers)
    {
        materials.TryGetValue(
            operation.MaterialId,
            out var material);

        users.TryGetValue(
            operation.UserId,
            out var user);

        string? documentNumber = null;

        if (operation.DocumentId.HasValue)
        {
            documentNumbers.TryGetValue(
                operation.DocumentId.Value,
                out documentNumber);
        }

        return new OperationJournalItemResponse(
            operation.Id,
            operation.MaterialId,
            material?.Name ?? "Неизвестный материал",
            material?.Article ?? "—",
            operation.Type.ToString(),
            GetDisplayType(operation),
            operation.Quantity,
            operation.QuantityBefore,
            operation.QuantityChange,
            operation.QuantityAfter,
            operation.UserId,
            user?.FullName ??
            user?.Login ??
            "Неизвестный пользователь",
            operation.DocumentId,
            documentNumber,
            operation.IsReversal,
            operation.ReversedOperationId,
            operation.CreatedAtUtc,
            operation.Comment);
    }

    private static string GetDisplayType(
        Operation operation)
    {
        if (operation.IsReversal)
        {
            return operation.Type switch
            {
                OperationType.Receiving =>
                    "Отмена прихода",

                OperationType.Issue =>
                    "Отмена расхода",

                _ =>
                    $"Отмена {operation.Type}"
            };
        }

        return operation.Type switch
        {
            OperationType.Receiving =>
                "Приход",

            OperationType.Issue =>
                "Расход",

            OperationType.Inventory =>
                "Инвентаризация",

            _ =>
                operation.Type.ToString()
        };
    }
}
