using AlmazManager.Application.Features.InventoryDocuments.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class UpdateInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public UpdateInventoryDocumentHandler(
        IInventoryDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        ICategoryAccessService categoryAccessService)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<InventoryDocumentResponse> HandleAsync(
        UpdateInventoryDocumentCommand command)
    {
        var document =
            await _documentRepository.GetByIdAsync(
                command.DocumentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ инвентаризации не найден.");
        }

        if (document.Status !=
            InventoryDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Редактировать можно только черновик инвентаризации.");
        }

        foreach (var existingItem in document.Items)
        {
            var existingMaterial = await _materialRepository.GetByIdAsync(
                existingItem.MaterialId);

            if (existingMaterial is null)
            {
                throw new InvalidOperationException(
                    "Материал из документа не найден.");
            }

            var existingPermission = existingMaterial.Kind == MaterialKind.Oracal641
                ? CategoryPermission.InventoryOracal
                : CategoryPermission.InventoryStandard;

            await _categoryAccessService.EnsureAccessAsync(
                existingMaterial.CategoryId,
                existingPermission);
        }

        if (command.Items is null ||
            command.Items.Count == 0)
        {
            throw new ArgumentException(
                "Инвентаризация должна содержать хотя бы одну позицию.");
        }

        if (command.Items
            .GroupBy(x => x.MaterialId)
            .Any(x => x.Count() > 1))
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять несколько раз.");
        }

        document.ChangeComment(
            command.Comment);

        var requestedIds =
            command.Items
                .Select(x => x.MaterialId)
                .ToHashSet();

        var existingToRemove =
            document.Items
                .Where(x =>
                    !requestedIds.Contains(
                        x.MaterialId))
                .Select(x => x.MaterialId)
                .ToList();

        MaterialKind? inventoryKind = null;

        foreach (var materialId in existingToRemove)
        {
            document.RemoveItem(materialId);
        }

        foreach (var requested in command.Items)
        {
            if (requested.ActualQuantity < 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(requested.ActualQuantity),
                    "Фактическое количество не может быть отрицательным.");
            }

            var material =
                await _materialRepository.GetByIdAsync(
                    requested.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    $"Материал {requested.MaterialId} не найден.");
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

            if (material.Kind == MaterialKind.Standard &&
                requested.ActualQuantity != decimal.Truncate(requested.ActualQuantity))
            {
                throw new ArgumentException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            var permission = material.Kind == MaterialKind.Oracal641
                ? CategoryPermission.InventoryOracal
                : CategoryPermission.InventoryStandard;

            await _categoryAccessService.EnsureAccessAsync(
                material.CategoryId,
                permission);

            var existing =
                document.Items.FirstOrDefault(
                    x =>
                        x.MaterialId ==
                        requested.MaterialId);

            if (existing is not null)
            {
                document.ChangeItemActualQuantity(
                    requested.MaterialId,
                    requested.ActualQuantity);

                continue;
            }

            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    requested.MaterialId);

            document.AddItem(
                requested.MaterialId,
                stock?.Quantity ?? 0,
                requested.ActualQuantity);
        }

        await _documentRepository.SaveChangesAsync();

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository);
    }
}
