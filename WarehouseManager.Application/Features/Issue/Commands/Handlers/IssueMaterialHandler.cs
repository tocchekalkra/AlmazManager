using WarehouseManager.Application.Features.Issue.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Issue.Handlers;

public sealed class IssueMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public IssueMaterialHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<IssueMaterialResponse> HandleAsync(
        IssueMaterialCommand command)
    {
        var material =
            await _materialRepository.GetByIdAsync(command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

        var stock =
            await _stockRepository.GetByMaterialIdAsync(
                command.MaterialId);

        if (stock is null)
        {
            throw new InvalidOperationException(
                "Остаток материала не найден.");
        }

        stock.Decrease(command.Quantity);

        var details = string.Join(
            "; ",
            new[]
            {
                $"Получатель: {command.Receiver}",
                $"Цех: {command.Department}",
                string.IsNullOrWhiteSpace(command.OrderNumber)
                    ? null
                    : $"Заказ: {command.OrderNumber}",
                string.IsNullOrWhiteSpace(command.Comment)
                    ? null
                    : command.Comment
            }.Where(value => value is not null));

        var operation = new Operation(
            command.MaterialId,
            OperationType.Issue,
            command.Quantity,
            command.UserId,
            details);

        await _operationRepository.AddAsync(operation);
        await _operationRepository.SaveChangesAsync();

        return new IssueMaterialResponse(
            operation.Id,
            stock.MaterialId,
            command.Quantity,
            stock.Quantity,
            operation.CreatedAtUtc);
    }
}