using WarehouseManager.Application.Features.Inventory.Commands;
using WarehouseManager.Contracts.Responses.Inventory;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Inventory.Handlers;

public sealed class BulkInventoryHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public BulkInventoryHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<BulkInventoryResponse> HandleAsync(
        BulkInventoryCommand command)
    {
        if (command.UserId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь не указан.",
                nameof(command.UserId));
        }

        if (command.Items is null || command.Items.Count == 0)
        {
            throw new ArgumentException(
                "Список материалов для инвентаризации пуст.",
                nameof(command.Items));
        }

        var duplicateMaterialIds = command.Items
            .GroupBy(item => item.MaterialId)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateMaterialIds.Count > 0)
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять в массовую инвентаризацию несколько раз.");
        }

        var results = new List<BulkInventoryItemResponse>();

        foreach (var item in command.Items)
        {
            if (item.MaterialId == Guid.Empty)
            {
                throw new ArgumentException(
                    "В одной из позиций не указан материал.");
            }

            if (item.ActualQuantity < 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(item.ActualQuantity),
                    "Фактическое количество не может быть отрицательным.");
            }

            var material = await _materialRepository.GetByIdAsync(
                item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    $"Материал {item.MaterialId} не найден.");
            }

            var stock = await _stockRepository.GetByMaterialIdAsync(
                item.MaterialId);

            if (stock is null)
            {
                stock = new Stock(item.MaterialId);
                await _stockRepository.AddAsync(stock);
            }

            var previousQuantity = stock.Quantity;
            var difference = item.ActualQuantity - previousQuantity;
            var changed = difference != 0;

            Guid? operationId = null;

            if (changed)
            {
                stock.Adjust(item.ActualQuantity);

                var operationComment = BuildComment(
                    previousQuantity,
                    item.ActualQuantity,
                    difference,
                    command.Comment,
                    item.Comment);

                var operation = new Operation(
                    item.MaterialId,
                    OperationType.Inventory,
                    Math.Abs(difference),
                    command.UserId,
                    operationComment);

                await _operationRepository.AddAsync(operation);

                operationId = operation.Id;
            }

            results.Add(new BulkInventoryItemResponse(
                item.MaterialId,
                previousQuantity,
                item.ActualQuantity,
                difference,
                changed,
                operationId));
        }

        await _operationRepository.SaveChangesAsync();

        var changedItems = results.Count(item => item.Changed);

        return new BulkInventoryResponse(
            results.Count,
            changedItems,
            results.Count - changedItems,
            DateTime.UtcNow,
            results);
    }

    private static string BuildComment(
        decimal previousQuantity,
        decimal actualQuantity,
        decimal difference,
        string? generalComment,
        string? itemComment)
    {
        var parts = new List<string>
        {
            "Массовая инвентаризация.",
            $"Было: {previousQuantity};",
            $"стало: {actualQuantity};",
            $"разница: {difference}."
        };

        if (!string.IsNullOrWhiteSpace(generalComment))
        {
            parts.Add($"Общий комментарий: {generalComment.Trim()}.");
        }

        if (!string.IsNullOrWhiteSpace(itemComment))
        {
            parts.Add($"Комментарий позиции: {itemComment.Trim()}.");
        }

        return string.Join(" ", parts);
    }
}