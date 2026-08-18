using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class DeleteInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _repository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public DeleteInventoryDocumentHandler(
        IInventoryDocumentRepository repository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _repository = repository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
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

        foreach (var item in document.Items)
        {
            var material = await _materialRepository.GetByIdAsync(
                item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    "Материал из документа не найден.");
            }

            var permission = material.Kind == MaterialKind.Oracal641
                ? CategoryPermission.InventoryOracal
                : CategoryPermission.InventoryStandard;

            await _categoryAccessService.EnsureAccessAsync(
                material.CategoryId,
                permission);
        }

        await _repository.DeleteAsync(
            document);

        await _repository.SaveChangesAsync();
    }
}
