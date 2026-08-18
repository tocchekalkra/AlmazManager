using AlmazManager.Application.Features.Issue.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Issue.Handlers;

public sealed class IssueMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly ICurrentUserService _currentUserService;

    public IssueMaterialHandler(
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

        if (!material.IsActive)
        {
            throw new InvalidOperationException(
                "Архивный материал нельзя списывать со склада.");
        }

        if (material.Kind == MaterialKind.Standard &&
            command.Quantity != decimal.Truncate(command.Quantity))
        {
            throw new ArgumentException(
                "Для стандартного материала количество должно быть целым.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            material.CategoryId,
            CategoryPermission.Issue);

        var stock =
            await _stockRepository.GetByMaterialIdAsync(
                command.MaterialId);

        if (stock is null)
        {
            throw new InvalidOperationException(
                "Остаток материала не найден.");
        }

        var quantityBefore = stock.Quantity;

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
            quantityBefore,
            -command.Quantity,
            stock.Quantity,
            _currentUserService.UserId,
            null,
            false,
            null,
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
