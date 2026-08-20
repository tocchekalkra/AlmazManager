using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialByIdHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetMaterialByIdHandler(
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<MaterialResponse?> HandleAsync(Guid materialId)
    {
        if (materialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(materialId));
        }

        var material =
            await _materialRepository.GetByIdAsync(materialId);

        if (material is null)
        {
            return null;
        }

        if (!await _categoryAccessService.HasAccessAsync(
                material.CategoryId,
                CategoryPermission.View))
        {
            return null;
        }

        return new MaterialResponse(
            material.Id,
            material.Name,
            material.Article,
            material.CategoryId,
            material.MinimumQuantity,
            material.Unit.ToString(),
            material.IsActive);
    }
}
