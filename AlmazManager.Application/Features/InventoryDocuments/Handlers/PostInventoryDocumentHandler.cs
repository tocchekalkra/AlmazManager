using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class PostInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository
        _documentRepository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly IStockRepository
        _stockRepository;

    private readonly IOperationRepository
        _operationRepository;

    private readonly ICategoryAccessService
        _categoryAccessService;

    private readonly ICurrentUserService
        _currentUserService;

    private readonly IStockNotificationService
        _stockNotificationService;

    public PostInventoryDocumentHandler(
        IInventoryDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        ICategoryAccessService categoryAccessService,
        ICurrentUserService currentUserService,
        IStockNotificationService stockNotificationService)
    {
        _documentRepository =
            documentRepository;

        _materialRepository =
            materialRepository;

        _stockRepository =
            stockRepository;

        _operationRepository =
            operationRepository;

        _categoryAccessService =
            categoryAccessService;

        _currentUserService =
            currentUserService;

        _stockNotificationService = stockNotificationService;
    }

    public async Task<InventoryDocumentResponse>
        HandleAsync(
            Guid documentId)
    {
        var document =
            await _documentRepository
                .GetByIdAsync(
                    documentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ инвентаризации не найден.");
        }

        if (document.Status !=
            InventoryDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Провести можно только черновик инвентаризации.");
        }

        if (document.Items.Count == 0)
        {
            throw new InvalidOperationException(
                "Документ инвентаризации не содержит материалов.");
        }

        /*
         * Первый проход:
         * ничего не меняем,
         * только проверяем весь документ.
         */
        MaterialKind? inventoryKind = null;
        var materialsById = new Dictionary<Guid, Material>();

        foreach (var item in document.Items)
        {
            var material =
                await _materialRepository
                    .GetByIdAsync(
                        item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    "Материал не найден.");
            }

            if (!material.IsActive)
            {
                throw new InvalidOperationException(
                    $"Материал '{material.Name}' находится в архиве.");
            }

            if (inventoryKind.HasValue &&
                inventoryKind.Value != material.Kind)
            {
                throw new InvalidOperationException(
                    "Стандартные материалы и ORACAL должны инвентаризироваться отдельными документами.");
            }

            inventoryKind ??= material.Kind;
            materialsById[material.Id] = material;

            if (material.Kind == MaterialKind.Standard &&
                item.ActualQuantity != decimal.Truncate(item.ActualQuantity))
            {
                throw new InvalidOperationException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            var permission =
                material.Kind ==
                MaterialKind.Oracal641
                    ? CategoryPermission.InventoryOracal
                    : CategoryPermission.InventoryStandard;

            await _categoryAccessService
                .EnsureAccessAsync(
                    material.CategoryId,
                    permission);

            var stock =
                await _stockRepository
                    .GetByMaterialIdAsync(
                        item.MaterialId);

            var currentQuantity =
                stock?.Quantity ?? 0;

            if (currentQuantity !=
                item.ExpectedQuantity)
            {
                throw new InvalidOperationException(
                    $"Остаток материала '{material.Name}' изменился " +
                    $"после создания инвентаризации. " +
                    $"Было при создании: {item.ExpectedQuantity}; " +
                    $"сейчас: {currentQuantity}. " +
                    "Создайте инвентаризацию заново.");
            }
        }

        /*
         * Второй проход:
         * применяем фактические остатки.
         */
        var stockChanges = new List<(Material Material, decimal Before, decimal After)>();

        foreach (var item in document.Items)
        {
            var stock =
                await _stockRepository
                    .GetByMaterialIdAsync(
                        item.MaterialId);

            if (stock is null)
            {
                stock =
                    new Stock(
                        item.MaterialId);

                await _stockRepository
                    .AddAsync(
                        stock);
            }

            var before =
                stock.Quantity;

            var change =
                item.ActualQuantity -
                before;

            if (change == 0)
            {
                continue;
            }

            stock.Adjust(
                item.ActualQuantity);

            var operation =
                new Operation(
                    item.MaterialId,
                    OperationType.Inventory,
                    before,
                    change,
                    stock.Quantity,
                    _currentUserService.UserId,
                    document.Id,
                    false,
                    null,
                    $"Инвентаризация {document.Number}. " +
                    $"Учёт: {before}; " +
                    $"факт: {item.ActualQuantity}; " +
                    $"разница: {change}.");

            await _operationRepository
                .AddAsync(
                    operation);

            stockChanges.Add((materialsById[item.MaterialId], before, stock.Quantity));
        }

        document.Post();

        await _documentRepository
            .SaveChangesAsync();

        foreach (var change in stockChanges)
        {
            await _stockNotificationService.HandleStockChangeAsync(
                change.Material,
                change.Before,
                change.After);
        }

        return await InventoryDocumentMapper
            .MapAsync(
                document,
                _materialRepository);
    }
}
