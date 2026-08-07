using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments;

internal static class InventoryDocumentMapper
{
    public static async Task<InventoryDocumentResponse> MapAsync(
        InventoryDocument document,
        IMaterialRepository materialRepository)
    {
        var items =
            new List<InventoryDocumentItemResponse>();

        foreach (var item in document.Items)
        {
            var material =
                await materialRepository.GetByIdAsync(
                    item.MaterialId);

            items.Add(
                new InventoryDocumentItemResponse(
                    item.Id,
                    item.MaterialId,
                    material?.Name ??
                    "Неизвестный материал",
                    material?.Article,
                    material?.Unit.ToString() ?? "—",
                    item.ExpectedQuantity,
                    item.ActualQuantity,
                    item.Difference));
        }

        return new InventoryDocumentResponse(
            document.Id,
            document.Number,
            document.UserId,
            document.Comment,
            document.Status.ToString(),
            document.CreatedAtUtc,
            document.PostedAtUtc,
            document.CancelledAtUtc,
            items.Count,
            items.Count(x => x.Difference != 0),
            items);
    }
}
