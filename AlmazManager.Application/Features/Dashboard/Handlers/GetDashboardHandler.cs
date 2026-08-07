using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Dashboard.Handlers;

public sealed class GetDashboardHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;

    public GetDashboardHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
    }

    public async Task<DashboardResponse> HandleAsync()
    {
        var materials = await _materialRepository.GetAllAsync();
        var categories = await _categoryRepository.GetAllAsync();
        var stocks = await _stockRepository.GetAllAsync();
        var operations = await _operationRepository.GetAllAsync();

        var stockByMaterialId = stocks.ToDictionary(
            stock => stock.MaterialId,
            stock => stock.Quantity);

        var activeMaterials = materials
            .Where(material => material.IsActive)
            .ToList();

        var totalQuantity = activeMaterials.Sum(material =>
            stockByMaterialId.GetValueOrDefault(material.Id, 0));

        var materialsWithStock = activeMaterials.Count(material =>
            stockByMaterialId.GetValueOrDefault(material.Id, 0) > 0);

        var materialsWithoutStock = activeMaterials.Count(material =>
            stockByMaterialId.GetValueOrDefault(material.Id, 0) <= 0);

        var belowMinimumCount = activeMaterials.Count(material =>
        {
            var currentQuantity =
                stockByMaterialId.GetValueOrDefault(material.Id, 0);

            return currentQuantity < material.MinimumQuantity;
        });

        var receivingOperations = operations.Count(operation =>
            operation.Type == OperationType.Receiving);

        var issueOperations = operations.Count(operation =>
            operation.Type == OperationType.Issue);

        var inventoryOperations = operations.Count(operation =>
            operation.Type == OperationType.Inventory);

        return new DashboardResponse(
            materials.Count,
            activeMaterials.Count,
            categories.Count,
            totalQuantity,
            materialsWithStock,
            materialsWithoutStock,
            belowMinimumCount,
            operations.Count,
            receivingOperations,
            issueOperations,
            inventoryOperations);
    }
}
