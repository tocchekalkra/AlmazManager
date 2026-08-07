using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class CancelInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public CancelInventoryDocumentHandler(
        IInventoryDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<InventoryDocumentResponse> HandleAsync(
        Guid documentId)
    {
        var document =
            await _documentRepository.GetByIdAsync(
                documentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ инвентаризации не найден.");
        }

        if (document.Status !=
            InventoryDocumentStatus.Posted)
        {
            throw new InvalidOperationException(
                "Отменить можно только проведённую инвентаризацию.");
        }

        var originalOperations =
            await _operationRepository.GetByDocumentIdAsync(
                document.Id);

        // Сначала проверяем, возможна ли полная отмена.
        foreach (var operation in originalOperations
                     .Where(x =>
                         x.Type == OperationType.Inventory &&
                         !x.IsReversal))
        {
            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    operation.MaterialId);

            if (stock is null)
            {
                throw new InvalidOperationException(
                    "Остаток материала не найден.");
            }

            var reversalChange =
                -operation.QuantityChange;

            if (stock.Quantity + reversalChange < 0)
            {
                throw new InvalidOperationException(
                    "Невозможно отменить инвентаризацию: " +
                    "остаток одного из материалов станет отрицательным.");
            }
        }

        foreach (var original in originalOperations
                     .Where(x =>
                         x.Type == OperationType.Inventory &&
                         !x.IsReversal))
        {
            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    original.MaterialId);

            if (stock is null)
            {
                throw new InvalidOperationException(
                    "Остаток материала не найден.");
            }

            var before = stock.Quantity;
            var reversalChange =
                -original.QuantityChange;

            stock.Adjust(
                before + reversalChange);

            var reversal =
                new Domain.Entities.Operation(
                    original.MaterialId,
                    OperationType.Inventory,
                    before,
                    reversalChange,
                    stock.Quantity,
                    document.UserId,
                    document.Id,
                    true,
                    original.Id,
                    $"Отмена инвентаризации {document.Number}.");

            await _operationRepository.AddAsync(
                reversal);
        }

        document.Cancel();

        await _documentRepository.SaveChangesAsync();

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository);
    }
}
