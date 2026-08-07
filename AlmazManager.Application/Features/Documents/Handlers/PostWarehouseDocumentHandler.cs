using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class PostWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public PostWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<WarehouseDocumentResponse> HandleAsync(
        Guid documentId)
    {
        var document =
            await _documentRepository.GetByIdAsync(
                documentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ не найден.");
        }

        if (document.Status !=
            WarehouseDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Провести можно только черновик документа.");
        }

        if (document.Items.Count == 0)
        {
            throw new InvalidOperationException(
                "Документ не содержит материалов.");
        }

        // Сначала полностью проверяем документ.
        // Остатки пока не меняем.
        foreach (var item in document.Items)
        {
            var material =
                await _materialRepository.GetByIdAsync(
                    item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    "Материал не найден.");
            }

            if (!material.IsActive)
            {
                throw new InvalidOperationException(
                    $"Материал '{material.Name}' находится в архиве.");
            }

            if (document.Type ==
                WarehouseDocumentType.Issue)
            {
                var existingStock =
                    await _stockRepository
                        .GetByMaterialIdAsync(
                            item.MaterialId);

                var availableQuantity =
                    existingStock?.Quantity ?? 0;

                if (availableQuantity <
                    item.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Недостаточно материала '{material.Name}' на складе. " +
                        $"Остаток: {availableQuantity}, " +
                        $"требуется: {item.Quantity}.");
                }
            }
        }

        // Только после полной проверки
        // выполняем движения.
        foreach (var item in document.Items)
        {
            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    item.MaterialId);

            if (stock is null)
            {
                stock = new Stock(item.MaterialId);

                await _stockRepository.AddAsync(stock);
            }

            var quantityBefore = stock.Quantity;

            decimal quantityChange;

            OperationType operationType;

            if (document.Type ==
                WarehouseDocumentType.Receiving)
            {
                quantityChange = item.Quantity;
                operationType = OperationType.Receiving;

                stock.Increase(item.Quantity);
            }
            else
            {
                quantityChange = -item.Quantity;
                operationType = OperationType.Issue;

                stock.Decrease(item.Quantity);
            }

            var quantityAfter = stock.Quantity;

            var operation =
                new Operation(
                    item.MaterialId,
                    operationType,
                    quantityBefore,
                    quantityChange,
                    quantityAfter,
                    document.UserId,
                    document.Id,
                    false,
                    null,
                    BuildOperationComment(document));

            await _operationRepository.AddAsync(
                operation);
        }

        document.Post();

        // Репозитории используют один WarehouseDbContext,
        // поэтому одного SaveChanges достаточно.
        await _documentRepository.SaveChangesAsync();

        return Map(document);
    }

    private static string BuildOperationComment(
        WarehouseDocument document)
    {
        var action =
            document.Type ==
            WarehouseDocumentType.Receiving
                ? "Документ прихода"
                : "Документ расхода";

        if (string.IsNullOrWhiteSpace(
                document.Comment))
        {
            return $"{action} {document.Number}.";
        }

        return
            $"{action} {document.Number}. " +
            document.Comment;
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
