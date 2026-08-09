using AlmazManager.Application.Interfaces;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class CancelWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository
        _documentRepository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly IStockRepository
        _stockRepository;

    private readonly IOperationRepository
        _operationRepository;

    private readonly ICurrentUserService
        _currentUserService;

    public CancelWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        ICurrentUserService currentUserService)
    {
        _documentRepository =
            documentRepository;

        _materialRepository =
            materialRepository;

        _stockRepository =
            stockRepository;

        _operationRepository =
            operationRepository;

        _currentUserService =
            currentUserService;
    }

    public async Task<WarehouseDocumentResponse>
        HandleAsync(
            Guid documentId)
    {
        var document =
            await _documentRepository
                .GetByIdAsync(
                    documentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ не найден.");
        }

        if (document.Status !=
            WarehouseDocumentStatus.Posted)
        {
            throw new InvalidOperationException(
                "Отменить можно только проведённый документ.");
        }

        var originalOperations =
            await _operationRepository
                .GetByDocumentIdAsync(
                    document.Id);

        foreach (var item in document.Items)
        {
            var material =
                await _materialRepository
                    .GetByIdAsync(
                        item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    "Материал не найден.");
            }

            var stock =
                await _stockRepository
                    .GetByMaterialIdAsync(
                        item.MaterialId);

            if (stock is null)
            {
                throw new InvalidOperationException(
                    $"Остаток материала '{material.Name}' не найден.");
            }

            if (document.Type ==
                    WarehouseDocumentType.Receiving
                &&
                stock.Quantity <
                    item.Quantity)
            {
                throw new InvalidOperationException(
                    $"Невозможно отменить приход '{document.Number}'. " +
                    $"Текущий остаток материала '{material.Name}' " +
                    $"равен {stock.Quantity}, " +
                    $"а требуется вернуть {item.Quantity}.");
            }
        }

        foreach (var item in document.Items)
        {
            var stock =
                await _stockRepository
                    .GetByMaterialIdAsync(
                        item.MaterialId);

            if (stock is null)
            {
                throw new InvalidOperationException(
                    "Остаток материала не найден.");
            }

            var quantityBefore =
                stock.Quantity;

            decimal quantityChange;

            OperationType operationType;

            if (document.Type ==
                WarehouseDocumentType.Receiving)
            {
                stock.Decrease(
                    item.Quantity);

                quantityChange =
                    -item.Quantity;

                operationType =
                    OperationType.Receiving;
            }
            else
            {
                stock.Increase(
                    item.Quantity);

                quantityChange =
                    item.Quantity;

                operationType =
                    OperationType.Issue;
            }

            var quantityAfter =
                stock.Quantity;

            var originalOperation =
                originalOperations
                    .Where(x =>
                        x.MaterialId ==
                        item.MaterialId)
                    .Where(x =>
                        !x.IsReversal)
                    .OrderByDescending(x =>
                        x.CreatedAtUtc)
                    .FirstOrDefault();

            var reversalOperation =
                new Operation(
                    item.MaterialId,
                    operationType,
                    quantityBefore,
                    quantityChange,
                    quantityAfter,
                    _currentUserService.UserId,
                    document.Id,
                    true,
                    originalOperation?.Id,
                    BuildCancellationComment(
                        document));

            await _operationRepository
                .AddAsync(
                    reversalOperation);
        }

        document.Cancel();

        await _documentRepository
            .SaveChangesAsync();

        return Map(document);
    }

    private static string BuildCancellationComment(
        WarehouseDocument document)
    {
        var action =
            document.Type ==
            WarehouseDocumentType.Receiving
                ? "Отмена документа прихода"
                : "Отмена документа расхода";

        return
            $"{action} {document.Number}.";
    }

    private static WarehouseDocumentResponse Map(
        WarehouseDocument document)
    {
        return new WarehouseDocumentResponse(
            document.Id,
            document.Number,
            document.Type.ToString(),
            document.Status.ToString(),
            document.UserId,
            document.Supplier,
            document.ExternalNumber,
            document.Comment,
            document.CreatedAtUtc,
            document.PostedAtUtc,
            document.CancelledAtUtc,
            document.Items
                .Select(x =>
                    new WarehouseDocumentItemResponse(
                        x.Id,
                        x.MaterialId,
                        x.Quantity))
                .ToList());
    }
}
