using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class GetInventoryDocumentsHandler
{
    private readonly IInventoryDocumentRepository _repository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetInventoryDocumentsHandler(
        IInventoryDocumentRepository repository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _repository = repository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<List<InventoryDocumentResponse>>
        HandleAsync()
    {
        var documents =
            await _repository.GetAllAsync();

        var result =
            new List<InventoryDocumentResponse>();

        var visibleMaterialIds =
            await GetVisibleMaterialIdsAsync();

        foreach (var document in documents)
        {
            if (visibleMaterialIds is not null &&
                !document.Items.Any(item =>
                    visibleMaterialIds.Contains(item.MaterialId)))
            {
                continue;
            }

            result.Add(
                await InventoryDocumentMapper.MapAsync(
                    document,
                    _materialRepository,
                    visibleMaterialIds));
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

        var visibleMaterialIds =
            await GetVisibleMaterialIdsAsync();

        if (visibleMaterialIds is not null &&
            !document.Items.Any(item =>
                visibleMaterialIds.Contains(item.MaterialId)))
        {
            return null;
        }

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository,
            visibleMaterialIds);
    }

    private async Task<HashSet<Guid>?>
        GetVisibleMaterialIdsAsync()
    {
        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is null)
        {
            return null;
        }

        var materials = await _materialRepository.GetAllAsync();

        return materials
            .Where(material =>
                allowedCategoryIds.Contains(material.CategoryId))
            .Select(material => material.Id)
            .ToHashSet();
    }
}
