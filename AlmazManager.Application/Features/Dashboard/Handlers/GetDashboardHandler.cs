using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Services;
using AlmazManager.Application.Security;
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
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly IWarehouseDocumentRepository _documentRepository;

    public GetDashboardHandler(
        IMaterialRepository materialRepository,
        ICategoryRepository categoryRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        IUserRepository userRepository,
        ICategoryAccessService categoryAccessService,
        IWarehouseDocumentRepository documentRepository)
    {
        _materialRepository = materialRepository;
        _categoryRepository = categoryRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
        _userRepository = userRepository;
        _categoryAccessService = categoryAccessService;
        _documentRepository = documentRepository;
    }

    public async Task<DashboardResponse> HandleAsync()
    {
        var materials = await _materialRepository.GetAllAsync();
        var categories = await _categoryRepository.GetAllAsync();
        var stocks = await _stockRepository.GetAllAsync();
        var operations = await _operationRepository.GetAllAsync();
        var documents = await _documentRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            materials = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .ToList();

            categories = categories
                .Where(category => allowedCategoryIds.Contains(category.Id))
                .ToList();

            var allowedMaterialIds = materials
                .Select(material => material.Id)
                .ToHashSet();

            stocks = stocks
                .Where(stock => allowedMaterialIds.Contains(stock.MaterialId))
                .ToList();

            operations = operations
                .Where(operation =>
                    allowedMaterialIds.Contains(operation.MaterialId))
                .ToList();

            documents = documents
                .Where(document => document.Items.Any(item =>
                    allowedMaterialIds.Contains(item.MaterialId)))
                .ToList();
        }

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

        var today = DateOnly.FromDateTime(DateTime.Now);
        var yesterday = today.AddDays(-1);
        var visibleMaterialIds = materials.Select(material => material.Id).ToHashSet();

        var receivingToday = documents
            .Where(document =>
                document.Type == WarehouseDocumentType.Receiving &&
                document.Status == WarehouseDocumentStatus.Posted &&
                document.DocumentDate == today)
            .Sum(document => document.Items.Count(item => visibleMaterialIds.Contains(item.MaterialId)));

        var issueToday = documents
            .Where(document =>
                document.Type == WarehouseDocumentType.Issue &&
                document.Status == WarehouseDocumentStatus.Posted &&
                document.DocumentDate == today)
            .Sum(document => document.Items.Count(item => visibleMaterialIds.Contains(item.MaterialId)));

        var issueYesterday = documents
            .Where(document =>
                document.Type == WarehouseDocumentType.Issue &&
                document.Status == WarehouseDocumentStatus.Posted &&
                document.DocumentDate == yesterday)
            .Sum(document => document.Items.Count(item => visibleMaterialIds.Contains(item.MaterialId)));

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
            .Take(3)
            .Select(item =>
                new DashboardAttentionMaterialResponse(
                    item.Material.Id,
                    MaterialDisplayName.Format(item.Material),
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
            .Take(3)
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
                    MaterialDisplayName.Format(material),
                    GetQuantityChange(operation),
                    GetUnitCode(material.Unit),
                    operation.UserId,
                    userInfo.FullName,
                    userInfo.Login));
        }

        var users = (await _userRepository.GetAllAsync())
            .ToDictionary(user => user.Id);

        var recentDocuments = documents
            .Where(document =>
                document.Status == WarehouseDocumentStatus.Posted ||
                document.Status == WarehouseDocumentStatus.Cancelled)
            .OrderByDescending(document => document.PostedAtUtc ?? document.CreatedAtUtc)
            .Take(3)
            .Select(document =>
            {
                var visibleItems = document.Items
                    .Where(item => materialById.ContainsKey(item.MaterialId))
                    .ToList();
                var names = visibleItems
                    .Select(item => MaterialDisplayName.Format(materialById[item.MaterialId]))
                    .Distinct()
                    .Take(2)
                    .ToList();
                var summary = string.Join(", ", names);

                if (visibleItems.Select(item => item.MaterialId).Distinct().Count() > names.Count)
                    summary += $" и ещё {visibleItems.Count - names.Count}";

                return new DashboardRecentDocumentResponse(
                    document.Id,
                    document.Number,
                    document.Type.ToString(),
                    document.CreatedAtUtc,
                    document.PostedAtUtc,
                    document.UserId,
                    users.GetValueOrDefault(document.UserId)?.FullName ?? "Неизвестный пользователь",
                    document.Recipient,
                    visibleItems.Count,
                    summary);
            })
            .ToList();

        var consumptionDays = BuildConsumptionDays(
            documents,
            materialById,
            today.AddDays(-6),
            today);

        var inkByMachine = activeMaterials
            .Where(material =>
                material.Kind == MaterialKind.Ink &&
                !string.IsNullOrWhiteSpace(material.MachineName))
            .GroupBy(material => material.MachineName!.Trim())
            .OrderBy(group => group.Key)
            .Select(machine =>
            {
                var colors = machine
                    .GroupBy(material => material.ColorName ?? "Без цвета")
                    .Select(color =>
                    {
                        var quantity = color.Sum(material =>
                            stockByMaterialId.GetValueOrDefault(material.Id, 0));
                        var minimum = color.Sum(material => material.MinimumQuantity);
                        var first = color.First();

                        return new DashboardInkColorResponse(
                            color.Key,
                            first.ColorHex ?? "#808080",
                            quantity,
                            minimum,
                            quantity < minimum);
                    })
                    .OrderBy(color => InkColorOrder(color.ColorName))
                    .ToList();

                return new DashboardInkMachineResponse(
                    machine.Key,
                    colors.Sum(color => color.QuantityLiters),
                    colors);
            })
            .ToList();

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
            receivingToday,
            issueToday,
            issueYesterday,
            attentionMaterials,
            recentOperations,
            recentDocuments,
            consumptionDays,
            inkByMachine);
    }

    public async Task<ConsumptionStatisticsResponse> GetConsumptionAsync(
        DateOnly from,
        DateOnly to,
        Guid? materialId = null,
        Guid? categoryId = null,
        Guid? userId = null)
    {
        if (to < from)
            throw new ArgumentException("Дата окончания периода не может быть раньше даты начала.");

        if (to.DayNumber - from.DayNumber > 366)
            throw new ArgumentException("Период статистики не может быть больше 366 дней.");

        var materials = await _materialRepository.GetAllAsync();
        var allowedCategoryIds = await _categoryAccessService.GetAllowedCategoryIdsAsync(CategoryPermission.View);

        if (allowedCategoryIds is not null)
            materials = materials.Where(x => allowedCategoryIds.Contains(x.CategoryId)).ToList();

        if (categoryId.HasValue)
            materials = materials.Where(x => x.CategoryId == categoryId.Value).ToList();

        if (materialId.HasValue)
            materials = materials.Where(x => x.Id == materialId.Value).ToList();

        var materialById = materials.ToDictionary(x => x.Id);
        var users = (await _userRepository.GetAllAsync()).ToDictionary(x => x.Id);
        var documents = (await _documentRepository.GetAllAsync())
            .Where(document =>
                document.Type == WarehouseDocumentType.Issue &&
                document.Status == WarehouseDocumentStatus.Posted &&
                (!userId.HasValue || document.UserId == userId.Value))
            .Where(document =>
            {
                return document.DocumentDate >= from && document.DocumentDate <= to;
            })
            .ToList();

        var dayItems = documents
            .SelectMany(document => document.Items
                .Where(item => materialById.ContainsKey(item.MaterialId))
                .Select(item => new
                {
                    Date = document.DocumentDate,
                    Document = document,
                    Item = item,
                    Material = materialById[item.MaterialId]
                }))
            .GroupBy(x => x.Date)
            .ToDictionary(group => group.Key, group => group.ToList());

        var days = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1)
            .Select(offset => from.AddDays(offset))
            .Select(date =>
            {
                var items = dayItems.GetValueOrDefault(date) ?? [];
                return new ConsumptionStatisticsDayResponse(
                    date,
                    items.Select(x => x.Document.Id).Distinct().Count(),
                    items.Count,
                    items.Select(x => new ConsumptionStatisticsItemResponse(
                        x.Document.Id,
                        x.Document.Number,
                        x.Document.PostedAtUtc,
                        x.Material.Id,
                        MaterialDisplayName.Format(x.Material),
                        x.Item.Quantity,
                        GetUnitCode(x.Material.Unit),
                        x.Document.Recipient,
                        x.Document.UserId,
                        users.GetValueOrDefault(x.Document.UserId)?.FullName ?? "Неизвестный пользователь")).ToList());
            })
            .ToList();

        return new ConsumptionStatisticsResponse(from, to, days);
    }

    private static IReadOnlyList<DashboardConsumptionDayResponse> BuildConsumptionDays(
        IEnumerable<Domain.Entities.WarehouseDocument> documents,
        IReadOnlyDictionary<Guid, Domain.Entities.Material> materials,
        DateOnly from,
        DateOnly to)
    {
        var issueDocuments = documents
            .Where(document =>
                document.Type == WarehouseDocumentType.Issue &&
                document.Status == WarehouseDocumentStatus.Posted)
            .ToList();

        return Enumerable.Range(0, to.DayNumber - from.DayNumber + 1)
            .Select(offset => from.AddDays(offset))
            .Select(date =>
            {
                var dayDocuments = issueDocuments
                    .Where(document => document.DocumentDate == date)
                    .ToList();
                var visibleItems = dayDocuments
                    .SelectMany(document => document.Items)
                    .Where(item => materials.ContainsKey(item.MaterialId))
                    .ToList();
                var topMaterial = visibleItems
                    .GroupBy(item => item.MaterialId)
                    .OrderByDescending(group => group.Sum(item => item.Quantity))
                    .Select(group => MaterialDisplayName.Format(materials[group.Key]))
                    .FirstOrDefault();

                return new DashboardConsumptionDayResponse(
                    date,
                    dayDocuments.Count,
                    visibleItems.Count,
                    topMaterial);
            })
            .ToList();
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

    private static int InkColorOrder(string colorName) => colorName switch
    {
        "Cyan" => 1,
        "Magenta" => 2,
        "Yellow" => 3,
        "Black" => 4,
        "White" => 5,
        _ => 99
    };
}
