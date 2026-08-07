using WarehouseManager.Contracts.Responses.InventoryDocuments;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.InventoryDocuments.Handlers;

public sealed class GetInventoryDocumentsHandler
{
    private readonly IInventoryDocumentRepository _repository;
    private readonly IMaterialRepository _materialRepository;

    public GetInventoryDocumentsHandler(
        IInventoryDocumentRepository repository,
        IMaterialRepository materialRepository)
    {
        _repository = repository;
        _materialRepository = materialRepository;
    }

    public async Task<List<InventoryDocumentResponse>>
        HandleAsync()
    {
        var documents =
            await _repository.GetAllAsync();

        var result =
            new List<InventoryDocumentResponse>();

        foreach (var document in documents)
        {
            result.Add(
                await InventoryDocumentMapper.MapAsync(
                    document,
                    _materialRepository));
        }

        return result;
    }

    public async Task<InventoryDocumentResponse?>
        HandleByIdAsync(Guid id)
    {
        var document =
            await _repository.GetByIdAsync(id);

        if (document is null)
        {
            return null;
        }

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository);
    }
}