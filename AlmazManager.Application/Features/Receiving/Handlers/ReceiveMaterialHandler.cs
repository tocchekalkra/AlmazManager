using AlmazManager.Application.Features.Receiving.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Receiving.Handlers;

public sealed class ReceiveMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly ICurrentUserService _currentUserService;

    public ReceiveMaterialHandler(
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

        if (!material.IsActive)
        {
            throw new InvalidOperationException(
                "Архивный материал нельзя принимать на склад.");
        }

        if (material.Kind == MaterialKind.Standard &&
            command.Quantity != decimal.Truncate(command.Quantity))
        {
            throw new ArgumentException(
                "Для стандартного материала количество должно быть целым.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            material.CategoryId,
            CategoryPermission.Receive);

        var stock =
            await _stockRepository.GetByMaterialIdAsync(
                command.MaterialId);

        if (stock is null)
        {
            stock = new Stock(command.MaterialId);

            await _stockRepository.AddAsync(stock);
        }

        var quantityBefore = stock.Quantity;

        stock.Increase(command.Quantity);

        var operation = new Operation(
            command.MaterialId,
            OperationType.Receiving,
            quantityBefore,
            command.Quantity,
            stock.Quantity,
            _currentUserService.UserId,
            null,
            false,
            null,
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
