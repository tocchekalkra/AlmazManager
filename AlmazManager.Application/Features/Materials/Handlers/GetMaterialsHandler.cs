using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialsHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetMaterialsHandler(
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<List<MaterialResponse>> HandleAsync()
    {
        var materials = await _materialRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            materials = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .ToList();
        }

        return materials
            .Select(material => new MaterialResponse(
                material.Id,
                material.Name,
                material.Article,
                material.CategoryId,
                material.MinimumQuantity,
                material.Unit.ToString(),
                material.IsActive))
            .ToList();
    }
}
