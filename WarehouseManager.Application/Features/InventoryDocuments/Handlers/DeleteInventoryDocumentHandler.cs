using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.InventoryDocuments.Handlers;

public sealed class DeleteInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _repository;

    public DeleteInventoryDocumentHandler(
        IInventoryDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task HandleAsync(Guid id)
    {
        var document =
            await _repository.GetByIdAsync(id);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ инвентаризации не найден.");
        }

        document.EnsureCanDelete();

        await _repository.DeleteAsync(
            document);

        await _repository.SaveChangesAsync();
    }
}