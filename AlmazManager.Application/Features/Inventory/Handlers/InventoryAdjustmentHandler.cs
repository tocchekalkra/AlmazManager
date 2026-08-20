using AlmazManager.Application.Features.Inventory.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Inventory;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Inventory.Handlers;

public sealed class InventoryAdjustmentHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly ICurrentUserService _currentUserService;

    public InventoryAdjustmentHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        ICategoryAccessService categoryAccessService,
        ICurrentUserService currentUserService)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
        _categoryAccessService = categoryAccessService;
        _currentUserService = currentUserService;
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

        if (!material.IsActive)
        {
            throw new InvalidOperationException(
                "Архивный материал нельзя инвентаризировать.");
        }

        if (material.Kind == MaterialKind.Standard &&
            command.ActualQuantity != decimal.Truncate(command.ActualQuantity))
        {
            throw new ArgumentException(
                "Для стандартного материала фактическое количество должно быть целым.");
        }

        var permission = material.Kind == MaterialKind.Oracal641
            ? CategoryPermission.InventoryOracal
            : CategoryPermission.InventoryStandard;

        await _categoryAccessService.EnsureAccessAsync(
            material.CategoryId,
            permission);

        var stock = await _stockRepository.GetByMaterialIdAsync(
            command.MaterialId);

        if (stock is null)
        {
            stock = new Stock(command.MaterialId);

            await _stockRepository.AddAsync(stock);
        }

        var previousQuantity = stock.Quantity;
        var difference = command.ActualQuantity - previousQuantity;

        if (difference == 0)
        {
            return new IssueInventoryResponse(
                Guid.Empty,
                stock.MaterialId,
                previousQuantity,
                stock.Quantity,
                0,
                DateTime.UtcNow);
        }

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
            previousQuantity,
            difference,
            stock.Quantity,
            _currentUserService.UserId,
            null,
            false,
            null,
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
