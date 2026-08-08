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
    private readonly IUserRepository _userRepository;

    public GetDashboardHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        IUserRepository userRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
        _userRepository = userRepository;
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

        var categoryById = categories.ToDictionary(
            category => category.Id,
            category => category.Name);

        var materialById = materials.ToDictionary(
            material => material.Id);

        var activeMaterials = materials
            .Where(material => material.IsActive)
            .ToList();

        var totalQuantity = activeMaterials.Sum(material =>
            stockByMaterialId.GetValueOrDefault(
                material.Id,
                0));

        var materialsWithStock = activeMaterials.Count(material =>
            stockByMaterialId.GetValueOrDefault(
                material.Id,
                0) > 0);

        var materialsWithoutStock = activeMaterials.Count(material =>
            stockByMaterialId.GetValueOrDefault(
                material.Id,
                0) <= 0);

        var belowMinimumCount = activeMaterials.Count(material =>
        {
            var currentQuantity =
                stockByMaterialId.GetValueOrDefault(
                    material.Id,
                    0);

            return currentQuantity < material.MinimumQuantity;
        });

        var receivingOperations = operations.Count(operation =>
            operation.Type == OperationType.Receiving);

        var issueOperations = operations.Count(operation =>
            operation.Type == OperationType.Issue);

        var inventoryOperations = operations.Count(operation =>
            operation.Type == OperationType.Inventory);

        var attentionMaterials = activeMaterials
            .Select(material =>
            {
                var quantity =
                    stockByMaterialId.GetValueOrDefault(
                        material.Id,
                        0);

                return new
                {
                    Material = material,
                    Quantity = quantity
                };
            })
            .Where(item =>
                item.Quantity < item.Material.MinimumQuantity)
            .OrderBy(item => item.Quantity <= 0 ? 0 : 1)
            .ThenBy(item =>
                item.Material.MinimumQuantity > 0
                    ? item.Quantity / item.Material.MinimumQuantity
                    : 1)
            .ThenBy(item => item.Material.Name)
            .Take(10)
            .Select(item =>
                new DashboardAttentionMaterialResponse(
                    item.Material.Id,
                    item.Material.Name,
                    item.Material.Article,
                    categoryById.GetValueOrDefault(
                        item.Material.CategoryId,
                        "Без категории"),
                    item.Quantity,
                    item.Material.MinimumQuantity,
                    GetUnitCode(item.Material.Unit),
                    item.Quantity <= 0
                        ? "OutOfStock"
                        : "LowStock"))
            .ToList();

        var recentOperationEntities = operations
            .OrderByDescending(operation =>
                operation.CreatedAtUtc)
            .Take(10)
            .ToList();

        var userCache =
            new Dictionary<Guid, (string FullName, string Login)>();

        var recentOperations =
            new List<DashboardRecentOperationResponse>();

        foreach (var operation in recentOperationEntities)
        {
            if (!materialById.TryGetValue(
                    operation.MaterialId,
                    out var material))
            {
                continue;
            }

            if (!userCache.TryGetValue(
                    operation.UserId,
                    out var userInfo))
            {
                var user = await _userRepository.GetByIdAsync(
                    operation.UserId);

                userInfo = user is null
                    ? (
                        "Неизвестный пользователь",
                        "unknown"
                    )
                    : (
                        user.FullName,
                        user.Login
                    );

                userCache[operation.UserId] = userInfo;
            }

            recentOperations.Add(
                new DashboardRecentOperationResponse(
                    operation.Id,
                    operation.CreatedAtUtc,
                    operation.Type.ToString(),
                    material.Name,
                    GetQuantityChange(operation),
                    GetUnitCode(material.Unit),
                    operation.UserId,
                    userInfo.FullName,
                    userInfo.Login));
        }

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
            inventoryOperations,
            attentionMaterials,
            recentOperations);
    }

    private static decimal GetQuantityChange(
        Domain.Entities.Operation operation)
    {
        if (operation.QuantityChange != 0)
        {
            return operation.QuantityChange;
        }

        return operation.Type switch
        {
            OperationType.Issue => -operation.Quantity,
            OperationType.WriteOff => -operation.Quantity,
            _ => operation.Quantity
        };
    }

    private static string GetUnitCode(
        MeasurementUnit unit)
    {
        return unit switch
        {
            MeasurementUnit.Piece => "pcs",
            MeasurementUnit.Meter => "m",
            MeasurementUnit.SquareMeter => "m2",
            MeasurementUnit.Kilogram => "kg",
            MeasurementUnit.Liter => "l",
            MeasurementUnit.Roll => "roll",
            MeasurementUnit.Sheet => "sheet",
            _ => string.Empty
        };
    }
}