using AlmazManager.Application.Features.Documents.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class UpdateWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository
        _documentRepository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly ICategoryAccessService
        _categoryAccessService;

    public UpdateWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _documentRepository =
            documentRepository;

        _materialRepository =
            materialRepository;

        _categoryAccessService =
            categoryAccessService;
    }

    public async Task<WarehouseDocumentResponse>
        HandleAsync(
            UpdateWarehouseDocumentCommand command)
    {
        if (command.DocumentId == Guid.Empty)
        {
            throw new ArgumentException(
                "Документ не указан.",
                nameof(command.DocumentId));
        }

        var document =
            await _documentRepository
                .GetByIdAsync(
                    command.DocumentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ не найден.");
        }

        if (document.Status !=
            WarehouseDocumentStatus.Draft)
        {
            throw new InvalidOperationException(
                "Редактировать можно только черновик документа.");
        }

        var permission = document.Type == WarehouseDocumentType.Receiving
            ? CategoryPermission.Receive
            : CategoryPermission.Issue;

        foreach (var existingItem in document.Items)
        {
            var existingMaterial = await _materialRepository.GetByIdAsync(
                existingItem.MaterialId);

            if (existingMaterial is null)
            {
                throw new InvalidOperationException(
                    "Материал из документа не найден.");
            }

            await _categoryAccessService.EnsureAccessAsync(
                existingMaterial.CategoryId,
                permission);
        }

        if (command.Items is null ||
            command.Items.Count == 0)
        {
            throw new ArgumentException(
                "Документ должен содержать хотя бы одну позицию.");
        }

        var duplicates =
            command.Items
                .GroupBy(x => x.MaterialId)
                .Any(group => group.Count() > 1);

        if (duplicates)
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять в документ несколько раз.");
        }

        foreach (var item in command.Items)
        {
            if (item.MaterialId == Guid.Empty)
            {
                throw new ArgumentException(
                    "Материал не указан.");
            }

            if (item.Quantity <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(item.Quantity),
                    "Количество должно быть больше нуля.");
            }

            var material =
                await _materialRepository
                    .GetByIdAsync(
                        item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    $"Материал {item.MaterialId} не найден.");
            }

            if (!material.IsActive)
            {
                throw new InvalidOperationException(
                    $"Материал '{material.Name}' находится в архиве.");
            }

            if (material.Kind == MaterialKind.Standard &&
                item.Quantity != decimal.Truncate(item.Quantity))
            {
                throw new ArgumentException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            await _categoryAccessService.EnsureAccessAsync(
                material.CategoryId,
                permission);
        }

        if (command.DocumentDate.HasValue)
            document.ChangeDocumentDate(command.DocumentDate.Value);

        document.ChangeSupplier(command.Supplier);
        document.ChangeExternalNumber(command.ExternalNumber);
        document.ChangeRecipient(command.Recipient);
        document.ChangeComment(command.Comment);

        document.ReplaceItems(
            command.Items.Select(x =>
                (
                    x.MaterialId,
                    x.Quantity
                )));

        await _documentRepository
            .SaveChangesAsync();

        return Map(document);
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
