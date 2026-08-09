using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class DeleteWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public DeleteWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
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

        var permission = document.Type == WarehouseDocumentType.Receiving
            ? CategoryPermission.Receive
            : CategoryPermission.Issue;

        foreach (var item in document.Items)
        {
            var material = await _materialRepository.GetByIdAsync(
                item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    "Материал из документа не найден.");
            }

            await _categoryAccessService.EnsureAccessAsync(
                material.CategoryId,
                permission);
        }

        await _documentRepository.DeleteAsync(
            document);

        await _documentRepository.SaveChangesAsync();
    }
}
