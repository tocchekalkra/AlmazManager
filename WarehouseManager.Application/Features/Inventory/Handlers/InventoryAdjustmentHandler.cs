using WarehouseManager.Application.Features.Inventory.Commands;
using WarehouseManager.Contracts.Responses.Inventory;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Inventory.Handlers;

public sealed class InventoryAdjustmentHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public InventoryAdjustmentHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<IssueInventoryResponse> HandleAsync(
        InventoryAdjustmentCommand command)
    {
        if (command.MaterialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(command.MaterialId));
        }

        if (command.UserId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь не указан.",
                nameof(command.UserId));
        }

        if (command.ActualQuantity < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(command.ActualQuantity),
                "Фактическое количество не может быть отрицательным.");
        }

        var material = await _materialRepository.GetByIdAsync(
            command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

        var stock = await _stockRepository.GetByMaterialIdAsync(
            command.MaterialId);

        if (stock is null)
        {
            stock = new Stock(command.MaterialId);

            await _stockRepository.AddAsync(stock);
        }

        var previousQuantity = stock.Quantity;
        var difference = command.ActualQuantity - previousQuantity;

        stock.Adjust(command.ActualQuantity);

        var operationComment =
            $"Инвентаризация. " +
            $"Было: {previousQuantity}; " +
            $"стало: {command.ActualQuantity}; " +
            $"разница: {difference}.";

        if (!string.IsNullOrWhiteSpace(command.Comment))
        {
            operationComment +=
                $" Комментарий: {command.Comment.Trim()}";
        }

        var operation = new Operation(
            command.MaterialId,
            OperationType.Inventory,
            Math.Abs(difference),
            command.UserId,
            operationComment);

        await _operationRepository.AddAsync(operation);
        await _operationRepository.SaveChangesAsync();

        return new IssueInventoryResponse(
            operation.Id,
            stock.MaterialId,
            previousQuantity,
            stock.Quantity,
            difference,
            operation.CreatedAtUtc);
    }
}