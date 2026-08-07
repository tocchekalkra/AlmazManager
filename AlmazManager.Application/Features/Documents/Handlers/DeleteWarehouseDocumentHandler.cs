using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class DeleteWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository _documentRepository;

    public DeleteWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository)
    {
        _documentRepository = documentRepository;
    }

    public async Task HandleAsync(Guid documentId)
    {
        if (documentId == Guid.Empty)
        {
            throw new ArgumentException(
                "Документ не указан.",
                nameof(documentId));
        }

        var document =
            await _documentRepository.GetByIdAsync(
                documentId);

        if (document is null)
        {
            throw new InvalidOperationException(
                "Документ не найден.");
        }

        document.EnsureCanDelete();

        await _documentRepository.DeleteAsync(
            document);

        await _documentRepository.SaveChangesAsync();
    }
}
