using WarehouseManager.Contracts.Responses.Documents;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Documents.Handlers;

public sealed class GetWarehouseDocumentsHandler
{
    private readonly IWarehouseDocumentRepository _repository;

    public GetWarehouseDocumentsHandler(
        IWarehouseDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<WarehouseDocumentResponse>> HandleAsync()
    {
        var documents = await _repository.GetAllAsync();

        return documents
            .Select(Map)
            .ToList();
    }

    public async Task<WarehouseDocumentResponse?> HandleByIdAsync(
        Guid id)
    {
        var document =
            await _repository.GetByIdAsync(id);

        return document is null
            ? null
            : Map(document);
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