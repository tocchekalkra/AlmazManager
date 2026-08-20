using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class PostWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository
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

    private readonly ISupplyInvoiceRepository
        _supplyInvoiceRepository;

    private readonly IStockNotificationService
        _stockNotificationService;

    public PostWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        ICategoryAccessService categoryAccessService,
        ICurrentUserService currentUserService,
        ISupplyInvoiceRepository supplyInvoiceRepository,
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

        _supplyInvoiceRepository =
            supplyInvoiceRepository;

        _stockNotificationService =
            stockNotificationService;
    }

    public async Task<WarehouseDocumentResponse>
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
                "Документ не найден.");
        }

        if (document.Status !=
            WarehouseDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Провести можно только черновик документа.");
        }

        if (document.Items.Count == 0)
        {
            throw new InvalidOperationException(
                "Документ не содержит материалов.");
        }

        SupplyInvoice? supplyInvoice = null;

        if (document.SupplyInvoiceId.HasValue)
        {
            if (document.Type != WarehouseDocumentType.Receiving)
                throw new InvalidOperationException("Связать со счётом можно только документ прихода.");

            supplyInvoice = await _supplyInvoiceRepository.GetByIdAsync(document.SupplyInvoiceId.Value)
                ?? throw new InvalidOperationException("Связанный счёт не найден.");
        }

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

            materialsById[material.Id] = material;

            if (supplyInvoice is not null)
            {
                var supplyItem = supplyInvoice.Items.FirstOrDefault(x => x.MaterialId == item.MaterialId)
                    ?? throw new InvalidOperationException($"Материал '{material.Name}' отсутствует в связанном счёте.");

                if (item.Quantity > supplyItem.RemainingQuantity)
                    throw new InvalidOperationException($"Приход '{material.Name}' превышает оставшееся количество по счёту.");
            }

            if (material.Kind == MaterialKind.Standard &&
                item.Quantity != decimal.Truncate(item.Quantity))
            {
                throw new InvalidOperationException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            var permission =
                document.Type ==
                WarehouseDocumentType.Receiving
                    ? CategoryPermission.Receive
                    : CategoryPermission.Issue;

            await _categoryAccessService
                .EnsureAccessAsync(
                    material.CategoryId,
                    permission);

            if (document.Type ==
                WarehouseDocumentType.Issue)
            {
                var existingStock =
                    await _stockRepository
                        .GetByMaterialIdAsync(
                            item.MaterialId);

                var availableQuantity =
                    existingStock?.Quantity ??
                    0;

                if (availableQuantity <
                    item.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Недостаточно материала '{material.Name}' на складе. " +
                        $"Остаток: {availableQuantity}, " +
                        $"требуется: {item.Quantity}.");
                }
            }
        }

        var sequenceNumber = await _documentRepository.ReserveNextNumberAsync(document.Type);
        document.AssignNumber(sequenceNumber);

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
                    .AddAsync(stock);
            }

            var quantityBefore =
                stock.Quantity;

            decimal quantityChange;

            OperationType operationType;

            if (document.Type ==
                WarehouseDocumentType.Receiving)
            {
                quantityChange =
                    item.Quantity;

                operationType =
                    OperationType.Receiving;

                stock.Increase(
                    item.Quantity);
            }
            else
            {
                quantityChange =
                    -item.Quantity;

                operationType =
                    OperationType.Issue;

                stock.Decrease(
                    item.Quantity);
            }

            var quantityAfter =
                stock.Quantity;

            var operation =
                new Operation(
                    item.MaterialId,
                    operationType,
                    quantityBefore,
                    quantityChange,
                    quantityAfter,

                    // Кто реально провёл документ.
                    _currentUserService.UserId,

                    document.Id,
                    false,
                    null,
                    BuildOperationComment(
                        document));

            await _operationRepository
                .AddAsync(
                    operation);

            stockChanges.Add((materialsById[item.MaterialId], quantityBefore, quantityAfter));

            if (supplyInvoice is not null)
                supplyInvoice.RegisterReceipt(item.MaterialId, item.Quantity);
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

        return Map(document);
    }

    private static string BuildOperationComment(
        WarehouseDocument document)
    {
        var action =
            document.Type ==
            WarehouseDocumentType.Receiving
                ? "Документ прихода"
                : "Документ расхода";

        var parts =
            new List<string>
            {
                $"{action} {document.Number}."
            };

        if (!string.IsNullOrWhiteSpace(
                document.Supplier))
        {
            parts.Add(
                $"Поставщик: {document.Supplier}.");
        }

        if (!string.IsNullOrWhiteSpace(
                document.ExternalNumber))
        {
            parts.Add(
                $"Накладная: {document.ExternalNumber}.");
        }

        if (!string.IsNullOrWhiteSpace(document.Recipient))
        {
            parts.Add($"Получатель/объект: {document.Recipient}.");
        }

        if (!string.IsNullOrWhiteSpace(
                document.Comment))
        {
            parts.Add(
                document.Comment);
        }

        return string.Join(
            " ",
            parts);
    }

    private static WarehouseDocumentResponse Map(
        WarehouseDocument document)
    {
        return new WarehouseDocumentResponse(
            document.Id,
            document.Number,
            document.Type.ToString(),
            document.Status.ToString(),
            document.UserId,
            document.SequenceNumber,
            document.DocumentDate,
            document.SupplyInvoiceId,
            document.Supplier,
            document.ExternalNumber,
            document.Recipient,
            document.Comment,
            document.CreatedAtUtc,
            document.PostedAtUtc,
            document.CancelledAtUtc,
            document.Items
                .Select(x =>
                    new WarehouseDocumentItemResponse(
                        x.Id,
                        x.MaterialId,
                        x.Quantity))
                .ToList());
    }
}
