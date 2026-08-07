using AlmazManager.Application.Features.Documents.Commands;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class UpdateWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;

    public UpdateWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
    }

    public async Task<WarehouseDocumentResponse> HandleAsync(
        UpdateWarehouseDocumentCommand command)
    {
        if (command.DocumentId == Guid.Empty)
        {
            throw new ArgumentException(
                "Документ не указан.",
                nameof(command.DocumentId));
        }

        var document =
            await _documentRepository.GetByIdAsync(
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

        if (command.Items is null ||
            command.Items.Count == 0)
        {
            throw new ArgumentException(
                "Документ должен содержать хотя бы одну позицию.");
        }

        var duplicates = command.Items
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
                await _materialRepository.GetByIdAsync(
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
        }

        document.ChangeComment(
            command.Comment);

        document.ReplaceItems(
            command.Items.Select(x =>
                (
                    x.MaterialId,
                    x.Quantity
                )));

        await _documentRepository.SaveChangesAsync();

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
