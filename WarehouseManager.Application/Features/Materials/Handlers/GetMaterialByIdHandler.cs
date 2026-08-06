using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Materials.Handlers;

public sealed class GetMaterialByIdHandler
{
    private readonly IMaterialRepository _materialRepository;

    public GetMaterialByIdHandler(
        IMaterialRepository materialRepository)
    {
        _materialRepository = materialRepository;
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