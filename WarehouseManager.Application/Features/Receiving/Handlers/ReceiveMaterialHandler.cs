using WarehouseManager.Application.Features.Receiving.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Receiving.Handlers;

public sealed class ReceiveMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public ReceiveMaterialHandler(
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<ReceivingResponse> HandleAsync(
        ReceiveMaterialCommand command)
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
            stock = new Stock(command.MaterialId);

            await _stockRepository.AddAsync(stock);
        }

        stock.Increase(command.Quantity);

        var operation = new Operation(
            command.MaterialId,
            OperationType.Receiving,
            command.Quantity,
            command.UserId,
            command.Comment);

        await _operationRepository.AddAsync(operation);

        await _operationRepository.SaveChangesAsync();

        return new ReceivingResponse(
            operation.Id,
            stock.MaterialId,
            command.Quantity,
            stock.Quantity,
            operation.CreatedAtUtc);
    }
}