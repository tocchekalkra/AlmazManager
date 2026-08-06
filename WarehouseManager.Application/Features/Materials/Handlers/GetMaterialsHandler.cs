using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialsHandler
{
    private readonly IMaterialRepository _materialRepository;

    public GetMaterialsHandler(
        IMaterialRepository materialRepository)
    {
        _materialRepository = materialRepository;
    }

    public async Task<List<MaterialResponse>> HandleAsync()
    {
        var materials = await _materialRepository.GetAllAsync();

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