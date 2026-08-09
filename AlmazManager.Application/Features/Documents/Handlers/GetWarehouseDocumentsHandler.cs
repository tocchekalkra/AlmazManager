using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class GetWarehouseDocumentsHandler
{
    private readonly IWarehouseDocumentRepository
        _repository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly ICategoryAccessService
        _categoryAccessService;

    public GetWarehouseDocumentsHandler(
        IWarehouseDocumentRepository repository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _repository =
            repository;

        _materialRepository =
            materialRepository;

        _categoryAccessService =
            categoryAccessService;
    }

    public async Task<List<WarehouseDocumentResponse>>
        HandleAsync()
    {
        var documents =
            await _repository
                .GetAllAsync();

        var visibleMaterialIds =
            await GetVisibleMaterialIdsAsync();

        return documents
            .Where(document =>
                visibleMaterialIds is null ||
                document.Items.Any(item =>
                    visibleMaterialIds.Contains(item.MaterialId)))
            .Select(document =>
                Map(document, visibleMaterialIds))
            .ToList();
    }

    public async Task<WarehouseDocumentResponse?>
        HandleByIdAsync(
            Guid id)
    {
        var document =
            await _repository
                .GetByIdAsync(id);

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

        return Map(document, visibleMaterialIds);
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

    private static WarehouseDocumentResponse Map(
        WarehouseDocument document,
        HashSet<Guid>? visibleMaterialIds)
    {
        return new WarehouseDocumentResponse(
            document.Id,
            document.Number,
            document.Type.ToString(),
            document.Status.ToString(),
            document.UserId,
            document.Supplier,
            document.ExternalNumber,
            document.Comment,
            document.CreatedAtUtc,
            document.PostedAtUtc,
            document.CancelledAtUtc,
            document.Items
                .Where(item =>
                    visibleMaterialIds is null ||
                    visibleMaterialIds.Contains(item.MaterialId))
                .Select(x =>
                    new WarehouseDocumentItemResponse(
                        x.Id,
                        x.MaterialId,
                        x.Quantity))
                .ToList());
    }
}
