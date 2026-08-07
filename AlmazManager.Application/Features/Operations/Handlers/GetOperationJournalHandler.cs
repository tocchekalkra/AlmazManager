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

    public GetOperationJournalHandler(
        IOperationRepository operationRepository,
        IMaterialRepository materialRepository,
        IUserRepository userRepository,
        IWarehouseDocumentRepository documentRepository)
    {
        _operationRepository = operationRepository;
        _materialRepository = materialRepository;
        _userRepository = userRepository;
        _documentRepository = documentRepository;
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

        var materialById =
            materials.ToDictionary(x => x.Id);

        var userById =
            users.ToDictionary(x => x.Id);

        var documentById =
            documents.ToDictionary(x => x.Id);

        var query = operations.AsEnumerable();

        if (request.MaterialId.HasValue)
        {
            query = query.Where(x =>
                x.MaterialId ==
                request.MaterialId.Value);
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

                WarehouseDocument? document = null;

                if (operation.DocumentId.HasValue)
                {
                    documentById.TryGetValue(
                        operation.DocumentId.Value,
                        out document);
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
                    document?.Number.Contains(
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
                    documentById))
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

        return Map(
            operation,
            materials.ToDictionary(x => x.Id),
            users.ToDictionary(x => x.Id),
            documents.ToDictionary(x => x.Id));
    }

    private static OperationJournalItemResponse Map(
        Operation operation,
        Dictionary<Guid, Material> materials,
        Dictionary<Guid, AppUser> users,
        Dictionary<Guid, WarehouseDocument> documents)
    {
        materials.TryGetValue(
            operation.MaterialId,
            out var material);

        users.TryGetValue(
            operation.UserId,
            out var user);

        WarehouseDocument? document = null;

        if (operation.DocumentId.HasValue)
        {
            documents.TryGetValue(
                operation.DocumentId.Value,
                out document);
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
            document?.Number,
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
