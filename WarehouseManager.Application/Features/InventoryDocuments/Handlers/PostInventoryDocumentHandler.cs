using WarehouseManager.Contracts.Responses.InventoryDocuments;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.InventoryDocuments.Handlers;

public sealed class PostInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public PostInventoryDocumentHandler(
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
            InventoryDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Провести можно только черновик инвентаризации.");
        }

        // Сначала проверяем ВСЕ позиции.
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

            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    item.MaterialId);

            var currentQuantity =
                stock?.Quantity ?? 0;

            // Защита от изменения склада после начала подсчёта.
            if (currentQuantity != item.ExpectedQuantity)
            {
                throw new InvalidOperationException(
                    $"Остаток материала '{material.Name}' изменился " +
                    $"после создания инвентаризации. " +
                    $"Было при создании: {item.ExpectedQuantity}; " +
                    $"сейчас: {currentQuantity}. " +
                    "Обновите документ инвентаризации.");
            }
        }

        // После полной проверки применяем результаты.
        foreach (var item in document.Items)
        {
            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    item.MaterialId);

            if (stock is null)
            {
                stock = new Stock(item.MaterialId);

                await _stockRepository.AddAsync(
                    stock);
            }

            var before = stock.Quantity;
            var change = item.ActualQuantity - before;

            if (change == 0)
            {
                continue;
            }

            stock.Adjust(
                item.ActualQuantity);

            var operation =
                new Operation(
                    item.MaterialId,
                    OperationType.Inventory,
                    before,
                    change,
                    stock.Quantity,
                    document.UserId,
                    document.Id,
                    false,
                    null,
                    $"Инвентаризация {document.Number}. " +
                    $"Учёт: {before}; факт: {item.ActualQuantity}; " +
                    $"разница: {change}.");

            await _operationRepository.AddAsync(
                operation);
        }

        document.Post();

        await _documentRepository.SaveChangesAsync();

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository);
    }
}